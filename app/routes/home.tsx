import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { MetaArgs } from 'react-router';
import PageHeader from '~/components/page-header';
import { UserContext } from '~/contexts/user';
import { PermissionsContext } from '~/contexts/permissions';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';
import {
	InfoIcon,
	ChevronDownIcon,
	ArchiveIcon,
	DatabaseIcon,
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
import { UpdateLog } from '~/components/home/update-log-card';
import { EconomyCard } from '~/components/home/economy-card';
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

export function meta({}: MetaArgs) {
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

	const [updateLogLoading, setUpdateLogLoading] = useState(false);

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

	const [runningStatusOpen, setRunningStatusOpen] = useState(false);

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
					setInstance(null);
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

	const handleTasksRefresh = useCallback((result: RecentTasksFetchResult) => {
		if (result.error === null) setTasks(result.data!.tasks);
	}, []);

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

	// ---- 页面顶部操作区 ----

	const hasInstance = instance !== null;
	const isDeployed = instance?.isDeployed ?? false;
	const isOnline = serverOnline.current;
	const isCreating = pipeline.taskRunning && pipeline.createTaskId !== null;
	const isDeploying = pipeline.taskRunning && pipeline.deployTaskId !== null;
	const isStarting = pipeline.serverStarting;

	let primaryLabel: string;
	let primaryAction: () => void;
	let primaryDisabled: boolean;

	if (!hasInstance) {
		primaryLabel = '创建实例';
		primaryAction = () => {
			if (!pipeline.taskRunning) {
				pipeline.setCreateTaskId(null);
				pipeline.setDeployTaskId(null);
			}
			setDialogOpen(true);
		};
		primaryDisabled =
			pipeline.taskRunning ||
			!user?.whitelist_uuid ||
			(permissions !== null && !permissions.can_trigger_task);
	} else if (!isDeployed) {
		if (isDeploying) {
			primaryLabel = '部署中...';
			primaryAction = () => {};
			primaryDisabled = true;
		} else {
			primaryLabel = '部署';
			primaryAction = () => setDeployConfirmOpen(true);
			primaryDisabled =
				pipeline.taskRunning ||
				(permissions !== null && !permissions.can_trigger_task);
		}
	} else if (!isOnline || isStarting) {
		if (isStarting) {
			primaryLabel = '启动中...';
			primaryAction = () => {};
			primaryDisabled = true;
		} else {
			primaryLabel = '启动服务器';
			primaryAction = () => setStartOpen(true);
			primaryDisabled =
				pipeline.taskRunning ||
				pipeline.archiving ||
				(permissions !== null && !permissions.can_trigger_task);
		}
	} else {
		primaryLabel = '运行状态';
		primaryAction = () => setRunningStatusOpen(true);
		primaryDisabled = false;
	}

	interface DropdownEntry {
		type: 'item' | 'separator';
		label?: string;
		icon?: React.ComponentType<{ className?: string }>;
		action?: () => void;
		disabled?: boolean;
		variant?: 'default' | 'destructive';
	}

	const dropdownEntries: DropdownEntry[] = [];

	if (hasInstance && isDeployed) {
		dropdownEntries.push({
			type: 'item',
			label: '备份',
			icon: DatabaseIcon,
			action: () => setBackupOpen(true),
			disabled:
				pipeline.archiving ||
				(permissions !== null && !permissions.can_run_backup)
		});
		dropdownEntries.push({
			type: 'item',
			label: '归档',
			icon: ArchiveIcon,
			action: () => setArchiveOpen(true),
			disabled:
				pipeline.archiving ||
				(permissions !== null && !permissions.can_run_archive)
		});
	}

	if (hasInstance && isDeployed && isOnline && permissions?.can_stop_server) {
		dropdownEntries.push({ type: 'separator' });
		dropdownEntries.push({
			type: 'item',
			label: '停止服务器',
			icon: SquareIcon,
			action: () => setStopOpen(true),
			disabled: false
		});
	}

	if (hasInstance) {
		if (dropdownEntries.length > 0) {
			dropdownEntries.push({ type: 'separator' });
		}
		dropdownEntries.push({
			type: 'item',
			label: '删除实例',
			icon: Trash2Icon,
			action: () => setDeleteOpen(true),
			disabled: permissions !== null && !permissions.can_delete_instance,
			variant: 'destructive'
		});
	}

	const headerActions = (
		<div className="flex items-center gap-1">
			<Button onClick={primaryAction} disabled={primaryDisabled}>
				{primaryLabel}
			</Button>
			{dropdownEntries.length > 0 && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon-sm">
							<ChevronDownIcon />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{dropdownEntries.map((entry, i) => {
							if (entry.type === 'separator') {
								return <DropdownMenuSeparator key={`sep-${i}`} />;
							}
							const Icon = entry.icon;
							return (
								<DropdownMenuItem
									key={entry.label}
									onClick={entry.action}
									disabled={entry.disabled}
									variant={entry.variant}
								>
									{Icon && <Icon />}
									{entry.label}
								</DropdownMenuItem>
							);
						})}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);

	return (
		<>
			<PageHeader actions={headerActions}>Hi, {user?.username}</PageHeader>

			{pipeline.archiving && (
				<Alert variant="default" className="mb-4 border-amber-200 bg-amber-50 text-amber-800">
					<InfoIcon />
					<AlertDescription>
						当前实例正在归档中，请勿与实例进行交互。
					</AlertDescription>
				</Alert>
			)}

			{user && !user.whitelist_uuid && (
				<Alert variant="default" className="mb-4">
					<InfoIcon />
					<AlertDescription>
						你还没有绑定白名单。绑定后即可体验完整功能。
					</AlertDescription>
					<div className="md:flex gap-2 hidden absolute top-1/2 right-3 -translate-y-1/2">
						<Button size="sm" variant="outline" asChild>
							<a href="https://v.wjx.cn/vm/m93QvcR.aspx#" target="_blank" rel="noreferrer">申请白名单</a>
						</Button>
						<Button size="sm" variant="outline" asChild>
							<Link to="/profile">立即绑定</Link>
						</Button>
					</div>
				</Alert>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
			<div className="lg:col-span-2">
				<ServerStatus.Card
					notReady={instanceNotFound.current || !isDeployed}
					starting={pipeline.serverStarting}
					loading={serverLoading.current}
					online={serverOnline.current}
					instanceStatus={instanceStatus.current}
					playerCount={playerCount.current}
					instanceType={instance?.instanceType ?? '—'}
					zoneId={instance?.zoneId ?? '—'}
					ip={instance?.ip ?? '—'}
					chartData={chartData.current}
					onRefreshData={handleServerRefresh}
				/>
			</div>
			<div className="lg:col-span-1 flex flex-col gap-4">
				<RecentTasks.Card
					tasks={tasks}
					loading={tasksLoading.current && tasks.length === 0}
					refreshKey={pipeline.tasksRefreshKey}
					onRefreshData={handleTasksRefresh}
				/>
			</div>
		</div>

			<UpdateLog.Card loading={updateLogLoading} />

			<EconomyCard.Card />

			<Dialog open={deleteOpen} onOpenChange={v => setDeleteOpen(v)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>删除实例</DialogTitle>
						<DialogDescription>
							此操作将直接删除当前实例，不进行任何检查和备份。
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
							取消
						</Button>
						<Button variant="destructive" onClick={handleDelete} disabled={deleting}>
							{deleting ? '删除中...' : '删除'}
						</Button>
					</DialogFooter>
				</DialogContent>
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

			<Dialog open={runningStatusOpen} onOpenChange={v => setRunningStatusOpen(v)}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>服务器运行状态</DialogTitle>
						<DialogDescription>
							当前 Minecraft 服务器的实时运行信息。
						</DialogDescription>
					</DialogHeader>
					<div className="py-4 text-sm text-muted-foreground">
						详细状态信息将在后续版本中提供。
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setRunningStatusOpen(false)}>
							关闭
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
