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
import { deleteActiveInstance } from '~/utils/requests/instance';
import { triggerTask } from '~/utils/requests/task';
import { get } from '~/utils/requests';
import { useStateSSE } from '~/hooks/useStateSSE';
import type { ServerStatus as ServerStatusType } from '~/types/ServerStatus';
import type { ServerQuery } from '~/types/ServerQuery';
import { Times } from '~/utils/times';
import { useSSESync } from '~/routes/home/useSSESync';
import { useServerOnlineTransition } from '~/routes/home/useServerOnlineTransition';
import { useTaskPipeline } from '~/routes/home/useTaskPipeline';
import { buildServerActions, buildInstanceActions } from '~/routes/home/actions';

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

	const [dialogOpen, setDialogOpen] = useState(false);
	const [createLoading, setCreateLoading] = useState(false);

	const [deployConfirmOpen, setDeployConfirmOpen] = useState(false);
	const [deployTriggering, setDeployTriggering] = useState(false);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const [backupOpen, setBackupOpen] = useState(false);
	const [archiveOpen, setArchiveOpen] = useState(false);
	const [backupTriggering, setBackupTriggering] = useState(false);
	const [archiveTriggering, setArchiveTriggering] = useState(false);

	const [startOpen, setStartOpen] = useState(false);
	const [stopOpen, setStopOpen] = useState(false);
	const [starting, setStarting] = useState(false);
	const [stopping, setStopping] = useState(false);

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
	const instanceDeletedRef = useRef(false);
	const serverQuery = useRef<ServerQuery>(undefined);

	const fetchAllRef = useRef<() => Promise<void>>(async () => {});
	const pipeline = useTaskPipeline(() => fetchAllRef.current());

	async function fetchAll() {
		let srvOnline = false;
		await Promise.all([
			ServerStatus.fetchData(serverLoading).then(([srvRes, chartRes, idleRes, querySrvRes]) => {
				handleServerRefresh([srvRes, chartRes, idleRes, querySrvRes]);
				if (srvRes.error === null) srvOnline = srvRes.data!.Value.online;
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
			EcsCandidates.fetchData(ecsLoading).then(handleCandidatesRefresh),
			RecentTasks.fetchData(tasksLoading).then(res => {
				if (res.error === null) {
					handleTasksRefresh(res);
					pipeline.syncRunningTasks(res.data!.tasks, srvOnline);
				}
			})
		]);
	}
	fetchAllRef.current = fetchAll;

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

	useSSESync({
		srvValue: srvSSE.value,
		instValue: instSSE.value,
		setServerOnline: serverOnline.set,
		setPlayerCount: playerCount.set,
		setInstanceStatus: instanceStatus.set,
		setInstanceNotFound: instanceNotFound.set
	});

	useServerOnlineTransition({
		srvValue: srvSSE.value,
		startServerTriggeredRef: pipeline.startServerTriggeredRef,
		setTasksRefreshKey: pipeline.setTasksRefreshKey,
		serverQuery,
		setServerStarting: pipeline.setServerStarting
	});

	useEffect(() => {
		fetchAll();
	}, []);

	const isDeployed = instance?.isDeployed ?? false;

	const canStartServer = isDeployed && !serverOnline.current;
	const canStopServer = isDeployed && serverOnline.current;
	const canDeploy = !isDeployed;
	const canBackup = isDeployed;

	function handleAction(name: string) {
		if (name === '创建实例') {
			if (!pipeline.taskRunning) {
				pipeline.setCreateTaskId(null);
				pipeline.setDeployTaskId(null);
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
	}

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
			pipeline.startServerTriggeredRef.current = true;
			pipeline.setServerStarting(true);
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
		pipeline.setDeployTaskId(data!.ID);
		pipeline.setTaskRunning(true);
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
		pipeline.setCreateTaskId(data!.ID);
		pipeline.setTaskRunning(true);
		setCreateLoading(false);
		setDialogOpen(false);
		fetchAll();
	}

	const serverActions = buildServerActions({
		canStartServer,
		canStopServer,
		permissions,
		archiving: pipeline.archiving,
		handleAction
	});

	const instanceActions = buildInstanceActions({
		canDeploy,
		canBackup,
		permissions,
		archiving: pipeline.archiving,
		setDeployConfirmOpen,
		handleAction
	});

	return (
		<>
			<div className="flex items-center mb-6">
				<h1 className="text-3xl">Hi, {user?.username}</h1>
			</div>

			{pipeline.archiving && (
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
					starting={pipeline.serverStarting}
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
					busy={pipeline.taskRunning && !pipeline.startTaskId}
					loading={instanceLoading.current}
					busyLabel={pipeline.deployTaskId ? '实例部署中' : '实例创建中'}
					latestOutput={pipeline.latestOutput}
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
					refreshKey={pipeline.tasksRefreshKey}
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
