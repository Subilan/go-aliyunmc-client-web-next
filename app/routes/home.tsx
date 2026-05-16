import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { Route } from './+types/home';
import { UserContext } from '~/contexts/user';
import { PermissionsContext } from '~/contexts/permissions';
import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle
} from '@mui/material';
import {
	ArchiveIcon,
	DatabaseIcon,
	PlayIcon,
	RocketIcon,
	SquareIcon,
	Trash2Icon
} from 'lucide-react';
import useStateNamed from '~/hooks/useStateNamed';
import { Toast } from '~/root';
import type { Instance } from '~/types/Instance';
import type { EcsCandidate } from '~/types/EcsCandidate';
import type { Task } from '~/types/Task';
import type { PlayerListChartPoint } from '~/components/player-count-chart';
import CreateInstanceDialog from '~/components/create-instance-dialog';
import ConfirmTriggerDialog from '~/components/confirm-trigger-dialog';
import { ServerStatus } from '~/components/home/server-status-card';
import { InstanceStatus } from '~/components/home/instance-status-card';
import { EcsCandidates } from '~/components/home/ecs-candidates-card';
import { RecentTasks } from '~/components/home/recent-tasks-card';
import type { ServerStatusFetchResult } from '~/components/home/server-status-card';
import type { EcsCandidatesFetchResult } from '~/components/home/ecs-candidates-card';
import type { RecentTasksFetchResult } from '~/components/home/recent-tasks-card';
import type { FuncListItem } from '~/components/func-list';
import { deleteActiveInstance } from '~/utils/requests/instance';
import { triggerTask } from '~/utils/requests/task';
import { get } from '~/utils/requests';
import { useTaskSSE } from '~/hooks/useTaskSSE';
import { useStateSSE } from '~/hooks/useStateSSE';
import type { ServerStatus as ServerStatusType } from '~/types/ServerStatus';
import { queryServer } from '~/utils/requests/server';
import type { ServerQuery } from '~/types/ServerQuery';
import { Times } from '~/utils/times';

export function meta({}: Route.MetaArgs) {
	return [{ title: '控制台 - Seatide' }, { name: 'description', content: 'Seatide 玩家控制台' }];
}

export default function Home() {
	const user = useContext(UserContext);
	const permissions = useContext(PermissionsContext);

	const [instance, setInstance] = useState<Instance | null>(null);
	const [candidates, setCandidates] = useState<EcsCandidate[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const instanceNotFound = useStateNamed(false);

	const instanceStatus = useStateNamed('...');
	const serverOnline = useStateNamed(false);
	const playerCount = useStateNamed(0);
	const idleRemainingSecs = useStateNamed(-1);
	const chartData = useStateNamed<PlayerListChartPoint[]>([]);

	const [instanceLoading, serverLoading, ecsLoading, tasksLoading] = [
		useStateNamed(false),
		useStateNamed(false),
		useStateNamed(false),
		useStateNamed(false)
	];

	// Create instance dialog
	const [dialogOpen, setDialogOpen] = useState(false);
	const [createTaskId, setCreateTaskId] = useState<number | null>(null);
	const [deployTaskId, setDeployTaskId] = useState<number | null>(null);
	const [startTaskId, setStartTaskId] = useState<number | null>(null);
	const [archiveTaskId, setArchiveTaskId] = useState<number | null>(null);
	const [taskRunning, setTaskRunning] = useState(false);
	const [serverStarting, setServerStarting] = useState(false);
	const [createLoading, setCreateLoading] = useState(false);

	// SSE for live task output in the instance status card
	const createSSE = useTaskSSE(createTaskId);
	const deploySSE = useTaskSSE(deployTaskId);
	const startSSE = useTaskSSE(startTaskId);
	const archiveSSE = useTaskSSE(archiveTaskId);
	const activeOutputs = startTaskId
		? startSSE.outputs
		: deployTaskId
			? deploySSE.outputs
			: createSSE.outputs;
	const latestOutput =
		activeOutputs.length > 0 ? activeOutputs[activeOutputs.length - 1].output : null;

	const [deployConfirmOpen, setDeployConfirmOpen] = useState(false);
	const [deployTriggering, setDeployTriggering] = useState(false);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Backup / Archive confirmation dialogs
	const [backupOpen, setBackupOpen] = useState(false);
	const [archiveOpen, setArchiveOpen] = useState(false);
	const [backupTriggering, setBackupTriggering] = useState(false);
	const [archiveTriggering, setArchiveTriggering] = useState(false);

	// Start / Stop server confirmation dialogs
	const [startOpen, setStartOpen] = useState(false);
	const [stopOpen, setStopOpen] = useState(false);
	const [starting, setStarting] = useState(false);
	const [stopping, setStopping] = useState(false);

	// State SSE for live server/instance status updates
	const srvSSE = useStateSSE<ServerStatusType>(
		'/state/watch/server-status',
		'server_status_snapshot',
		'server_status_update'
	);
	const instSSE = useStateSSE<string>(
		'/state/watch/instance-status',
		'instance_status_snapshot',
		'instance_status_update'
	);
	const startServerTriggeredRef = useRef(false);
	const instanceDeletedRef = useRef(false);
	const serverQuery = useRef<ServerQuery>(undefined);

	const [tasksRefreshKey, setTasksRefreshKey] = useState(0);

	async function fetchAll() {
		let srvOnline = false;
		await Promise.all([
			ServerStatus.fetchData(serverLoading).then(([srvRes, chartRes, idleRes, querySrvRes]) => {
				if (querySrvRes.error === null) serverQuery.current = querySrvRes.data;
				if (srvRes.error === null) {
					srvOnline = srvRes.data!.Value.online;
					serverOnline.set(srvOnline);
					playerCount.set(srvRes.data!.Value.playerCount);
				}
				if (chartRes.error === null) {
					chartData.set(
						chartRes.data!.map(p => ({
							time: Times.formatDate(p.time, 'MM-DD HH:mm:ss'),
							playerNames: p.playerNames
						}))
					);
				}
				if (idleRes.error === null) idleRemainingSecs.set(idleRes.data!);
			}),
			InstanceStatus.fetchData(instanceLoading).then(([instRes, instStatusRes]) => {
				if (instRes.error === null) {
					setInstance(instRes.data);
					instanceNotFound.set(false);
					instanceDeletedRef.current = false;
				} else {
					instanceNotFound.set(true);
				}
				if (instStatusRes.error === null) instanceStatus.set(instStatusRes.data!.Value);
			}),
			EcsCandidates.fetchData(ecsLoading).then(res => {
				if (res.error === null) setCandidates(res.data!);
			}),
			RecentTasks.fetchData(tasksLoading).then(res => {
				if (res.error === null) {
					setTasks(res.data!.tasks);
					const runningCreate = res.data!.tasks.find(
						t => t.type === 'create_instance' && t.status === 'running'
					);
					const runningDeploy = res.data!.tasks.find(
						t => t.type === 'deploy' && t.status === 'running'
					);
					if (runningCreate || runningDeploy) {
						setCreateTaskId(runningCreate?.ID ?? null);
						setDeployTaskId(runningDeploy?.ID ?? null);
						setTaskRunning(true);
					}
					const runningStart = res.data!.tasks.find(
						t => t.type === 'start_server' && t.status === 'running'
					);
					if (runningStart) {
						setStartTaskId(runningStart.ID);
						setTaskRunning(true);
						if (!srvOnline) {
							setServerStarting(true);
							startServerTriggeredRef.current = true;
						}
					}
					const runningArchive = res.data!.tasks.find(
						t => t.type === 'archive' && t.status === 'running'
					);
					if (runningArchive) setArchiveTaskId(runningArchive.ID);
				}
			})
		]);
	}

	function handleServerRefresh([srvRes, chartRes, idleRes, querySrvRes]: ServerStatusFetchResult) {
		if (querySrvRes.error === null) serverQuery.current = querySrvRes.data;
		if (srvRes.error === null) {
			serverOnline.set(srvRes.data!.Value.online);
			playerCount.set(srvRes.data!.Value.playerCount);
		}
		if (chartRes.error === null) {
			chartData.set(
				chartRes.data!.map(p => ({
					time: Times.formatDate(p.time, 'MM-DD HH:mm:ss'),
					playerNames: p.playerNames
				}))
			);
		}
		if (idleRes.error === null) idleRemainingSecs.set(idleRes.data!);
	}

	function handleCandidatesRefresh(result: EcsCandidatesFetchResult) {
		if (result.error === null) setCandidates(result.data!);
	}

	function handleTasksRefresh(result: RecentTasksFetchResult) {
		if (result.error === null) setTasks(result.data!.tasks);
	}

	// Sync SSE values into named state
	useEffect(() => {
		if (srvSSE.value) {
			if (srvSSE.value.Error) {
				serverOnline.set(false);
				playerCount.set(0);
			} else {
				serverOnline.set(srvSSE.value.Value.online);
				playerCount.set(srvSSE.value.Value.playerCount);
			}
		}
	}, [srvSSE.value]);

	useEffect(() => {
		if (instSSE.value) {
			if (instSSE.value.Error) {
				instanceNotFound.set(true);
			} else {
				instanceStatus.set(instSSE.value.Value);
			}
		}
	}, [instSSE.value]);

	// Auto-refresh tasks when server becomes online after start_server trigger
	useEffect(() => {
		if (srvSSE.value?.Value.online) {
			if (startServerTriggeredRef.current) {
				startServerTriggeredRef.current = false;
				setTasksRefreshKey(k => k + 1);
			}
			queryServer().then(r => {
				if (r.error === null) serverQuery.current = r.data;
			});
			setServerStarting(false);
		}
	}, [srvSSE.value]);

	useEffect(() => {
		fetchAll();
	}, []);

	// Chain create -> deploy
	useEffect(() => {
		if (!createSSE.done || !createTaskId) return;
		if (createSSE.error) {
			Toast.error('创建实例失败: ' + createSSE.error);
			setCreateTaskId(null);
			setTaskRunning(false);
			return;
		}
		Toast.success('实例创建成功');
		triggerTask('deploy', {}).then(res => {
			if (res.data) {
				setDeployTaskId(res.data.ID);
				fetchAll();
			} else {
				Toast.error('触发部署失败: ' + res.error);
				setCreateTaskId(null);
				setTaskRunning(false);
			}
		});
	}, [createSSE.done]);

	// Chain deploy -> start_server
	useEffect(() => {
		if (!deploySSE.done || !deployTaskId) return;
		if (deploySSE.error) {
			Toast.error('部署失败: ' + deploySSE.error);
			setDeployTaskId(null);
			setTaskRunning(false);
			return;
		}
		Toast.success('部署成功');
		setServerStarting(true);
		startServerTriggeredRef.current = true;
		triggerTask('start_server', {}).then(res => {
			if (res.data) {
				setStartTaskId(res.data.ID);
				fetchAll();
			} else {
				Toast.error('触发启动服务器失败: ' + res.error);
				setDeployTaskId(null);
				setTaskRunning(false);
			}
		});
	}, [deploySSE.done]);

	// Refresh tasks when standalone start_server completes
	useEffect(() => {
		if (startSSE.done && startTaskId) {
			if (startSSE.error) {
				Toast.error('启动服务器失败: ' + startSSE.error);
			}
			setStartTaskId(null);
			setTaskRunning(false);
			fetchAll();
		}
	}, [startSSE.done]);

	// Refresh tasks when archive completes
	useEffect(() => {
		if (archiveSSE.done && archiveTaskId) {
			if (archiveSSE.error) {
				Toast.error('归档失败: ' + archiveSSE.error);
			} else {
				Toast.success('归档成功');
			}
			setArchiveTaskId(null);
			setTasksRefreshKey(k => k + 1);
		}
	}, [archiveSSE.done]);

	const isDeployed = instance?.isDeployed ?? false;

	const canStartServer = isDeployed && !serverOnline.current;
	const canStopServer = isDeployed && serverOnline.current;
	const canDeploy = !isDeployed;
	const canBackup = isDeployed;

	const archiving = archiveTaskId !== null;
	const handleAction = (name: string) => {
		if (name === '创建实例') {
			if (!taskRunning) {
				setCreateTaskId(null);
				setDeployTaskId(null);
			}
			setDialogOpen(true);
			return;
		}
		if (name === '删除实例') {
			setDeleteOpen(true);
			return;
		}
		if (name === '备份') {
			setBackupOpen(true);
			return;
		}
		if (name === '归档') {
			setArchiveOpen(true);
			return;
		}
		if (name === '启动服务器') {
			setStartOpen(true);
			return;
		}
		if (name === '停止服务器') {
			setStopOpen(true);
			return;
		}
		Toast.info(`${name} — 功能开发中`);
	};

	async function handleDelete() {
		setDeleting(true);
		const ok = await deleteActiveInstance();
		if (ok) {
			Toast.success('实例已删除');
		} else {
			Toast.error('删除实例失败');
		}
		setDeleting(false);
		setDeleteOpen(false);
		fetchAll();
	}

	async function handleBackup() {
		setBackupTriggering(true);
		const { error } = await triggerTask('backup', {});
		if (error) {
			Toast.error(typeof error === 'string' ? error : '任务触发失败');
		} else {
			Toast.success('备份任务已触发');
			fetchAll();
		}
		setBackupTriggering(false);
		setBackupOpen(false);
	}

	async function handleArchive() {
		setArchiveTriggering(true);
		const { error } = await triggerTask('archive', {});
		if (error) {
			Toast.error(typeof error === 'string' ? error : '任务触发失败');
		} else {
			Toast.success('归档任务已触发');
			fetchAll();
		}
		setArchiveTriggering(false);
		setArchiveOpen(false);
	}

	async function handleStartServer() {
		setStarting(true);
		const { error } = await triggerTask('start_server', {});
		if (error) {
			Toast.error(typeof error === 'string' ? error : '任务触发失败');
		} else {
			Toast.success('启动服务器任务已触发');
			startServerTriggeredRef.current = true;
			setServerStarting(true);
			fetchAll();
		}
		setStarting(false);
		setStartOpen(false);
	}

	async function handleStopServer() {
		setStopping(true);
		const { error } = await get('/server/stop');
		if (error) {
			Toast.error(typeof error === 'string' ? error : '请求停止服务器失败');
		} else {
			Toast.success('已请求停止服务器');
			fetchAll();
		}
		setStopping(false);
		setStopOpen(false);
	}

	async function handleDeploy() {
		setDeployTriggering(true);
		const { data, error } = await triggerTask('deploy', {});
		if (error) {
			Toast.error(typeof error === 'string' ? error : '部署任务触发失败');
			setDeployTriggering(false);
			return;
		}
		setDeployConfirmOpen(false);
		setDeployTaskId(data!.ID);
		setTaskRunning(true);
		setDeployTriggering(false);
		fetchAll();
	}

	async function handleCreateInstance() {
		setCreateLoading(true);
		const { data, error } = await triggerTask('create_instance', {
			useDefaultVSwitch: true,
			startWhenCreated: true
		});
		if (error) {
			Toast.error(typeof error === 'string' ? error : '触发创建失败');
			setCreateLoading(false);
			return;
		}
		Toast.success('创建任务已触发');
		setCreateTaskId(data!.ID);
		setTaskRunning(true);
		setCreateLoading(false);
		setDialogOpen(false);
		fetchAll();
	}

	const serverActions: FuncListItem[] = [
		{
			name: '启动服务器',
			icon: PlayIcon,
			action: () => handleAction('启动服务器'),
			disabled:
				!canStartServer ||
				(permissions !== null && !permissions.can_trigger_task) ||
				archiving
		},
		{
			name: '停止服务器',
			icon: SquareIcon,
			action: () => handleAction('停止服务器'),
			disabled: !canStopServer || (permissions !== null && !permissions.can_stop_server)
		}
	];

	const instanceActions: FuncListItem[] = [
		{
			name: '部署',
			icon: RocketIcon,
			action: () => setDeployConfirmOpen(true),
			disabled: !canDeploy || (permissions !== null && !permissions.can_trigger_task)
		},
		{
			name: '删除实例',
			icon: Trash2Icon,
			action: () => handleAction('删除实例'),
			disabled: permissions !== null && !permissions.can_delete_instance
		},
		{
			name: '备份',
			icon: DatabaseIcon,
			action: () => handleAction('备份'),
			disabled:
				!canBackup || archiving || (permissions !== null && !permissions.can_run_backup)
		},
		{
			name: '归档',
			icon: ArchiveIcon,
			action: () => handleAction('归档'),
			disabled:
				!canBackup || archiving || (permissions !== null && !permissions.can_run_archive)
		}
	];

	return (
		<>
			{/* header */}
			<div className="flex items-center mb-6">
				<h1 className="text-3xl">Hi, {user?.username}</h1>
			</div>

			{archiving && (
				<Alert severity="warning" className="mb-4">
					当前实例正在归档中，请勿与实例进行交互。
				</Alert>
			)}

			{user && !user.whitelist_uuid && (
				<Alert
					severity="info"
					className="mb-4"
					action={
						<div className="md:flex gap-2 hidden">
							<Button
								size="small"
								color="inherit"
								component="a"
								href="#"
								target="_blank"
							>
								申请白名单
							</Button>
							<Button size="small" color="inherit" component={Link} to="/profile">
								立即绑定
							</Button>
						</div>
					}
				>
					你还没有绑定白名单。绑定后即可体验完整功能。
				</Alert>
			)}

			<div className="flex flex-col gap-4">
				<ServerStatus.Card
					notReady={instanceNotFound.current || !isDeployed}
					starting={serverStarting}
					loading={serverLoading.current}
					online={serverOnline.current}
					playerCount={playerCount.current}
					platform={serverQuery.current?.platform}
					isPaper={!!serverQuery.current?.platform?.includes('Paper')}
					chartData={chartData.current}
					serverActions={serverActions}
					onRefreshData={handleServerRefresh}
				/>
				<InstanceStatus.Card
					notFound={instanceNotFound.current}
					busy={taskRunning && !startTaskId}
					loading={instanceLoading.current}
					busyLabel={deployTaskId ? '实例部署中' : '实例创建中'}
					latestOutput={latestOutput}
					instanceStatus={instanceStatus.current}
					instanceType={instance?.instanceType ?? '—'}
					zoneId={instance?.zoneId ?? '—'}
					ip={instance?.ip ?? '—'}
					instanceActions={instanceActions}
					onCreateInstance={() => handleAction('创建实例')}
				/>
				<EcsCandidates.Card
					candidates={candidates}
					loading={ecsLoading.current && candidates.length === 0}
					onRefreshData={handleCandidatesRefresh}
				/>
				<RecentTasks.Card
					tasks={tasks}
					loading={tasksLoading.current && tasks.length === 0}
					refreshKey={tasksRefreshKey}
					onRefreshData={handleTasksRefresh}
				/>
			</div>

			<Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
				<DialogTitle>删除实例</DialogTitle>
				<DialogContent>
					<DialogContentText>
						此操作将直接删除当前实例，不进行任何检查和备份。
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
						取消
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={handleDelete}
						disabled={deleting}
					>
						{deleting ? '删除中...' : '删除'}
					</Button>
				</DialogActions>
			</Dialog>

			<ConfirmTriggerDialog
				open={deployConfirmOpen}
				onClose={() => setDeployConfirmOpen(false)}
				title="部署"
				description="此操作将对当前实例执行部署。"
				onConfirm={handleDeploy}
				loading={deployTriggering}
			/>

			<ConfirmTriggerDialog
				open={backupOpen}
				onClose={() => setBackupOpen(false)}
				title="备份"
				description="此操作将对当前实例执行备份。"
				onConfirm={handleBackup}
				loading={backupTriggering}
			/>

			<ConfirmTriggerDialog
				open={archiveOpen}
				onClose={() => setArchiveOpen(false)}
				title="归档"
				description="此操作将对当前实例执行归档。"
				onConfirm={handleArchive}
				loading={archiveTriggering}
			/>

			<ConfirmTriggerDialog
				open={startOpen}
				onClose={() => setStartOpen(false)}
				title="启动服务器"
				description="此操作将启动当前实例上的 Minecraft 服务器。"
				onConfirm={handleStartServer}
				loading={starting}
			/>

			<ConfirmTriggerDialog
				open={stopOpen}
				onClose={() => setStopOpen(false)}
				title="停止服务器"
				description="此操作将停止当前实例上的 Minecraft 服务器，玩家将被断开连接。"
				onConfirm={handleStopServer}
				loading={stopping}
			/>

			<CreateInstanceDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				bestCandidate={candidates[0] ?? null}
				onTriggered={handleCreateInstance}
				loading={createLoading}
			/>
		</>
	);
}
