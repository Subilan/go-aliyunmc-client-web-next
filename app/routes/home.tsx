import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { Route } from './+types/home';
import { UserContext } from '~/contexts/user';
import { PermissionsContext } from '~/contexts/permissions';
import {
	Alert,
	Button,
	Card,
	CardContent,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip
} from '@mui/material';
import {
	ArchiveIcon,
	CheckIcon,
	ClockIcon,
	CpuIcon,
	DatabaseIcon,
	HardDriveIcon,
	Loader2Icon,
	PlayIcon,
	RefreshCwIcon,
	RocketIcon,
	ServerIcon,
	SquareIcon,
	Trash2Icon,
	type LucideIcon
} from 'lucide-react';
import useStateNamed from '~/hooks/useStateNamed';
import { Toast } from '~/root';
import type { Instance } from '~/types/Instance';
import type { EcsCandidate } from '~/types/EcsCandidate';
import type { Task } from '~/types/Task';
import PlayerCountChart from '~/components/player-count-chart';
import type { PlayerListChartPoint } from '~/components/player-count-chart';
import CreateInstanceDialog from '~/components/create-instance-dialog';
import DeployDialog from '~/components/deploy-dialog';
import ConfirmTriggerDialog from '~/components/confirm-trigger-dialog';
import { getActiveInstance, getCandidates, deleteActiveInstance } from '~/utils/requests/instance';
import { getServerStatus, getInstanceStatus } from '~/utils/requests/state';
import { getTasks, getPlayerListHistory, getIdleRemainingSecs } from '~/utils/requests/home';
import { triggerTask } from '~/utils/requests/task';
import { get } from '~/utils/requests';
import { useTaskSSE } from '~/hooks/useTaskSSE';
import { useStateSSE } from '~/hooks/useStateSSE';
import type { ServerStatus } from '~/types/ServerStatus';
import { queryServer } from '~/utils/requests/server';
import type { ServerQuery } from '~/types/ServerQuery';
import { taskStatusIcon } from '~/routes/tasks';
import { Times } from '~/utils/times';

// ---------- helpers ----------

function instanceStatusColor(status: string) {
	switch (status) {
		case 'Running':
			return 'bg-green-500';
		case 'Starting':
		case 'Stopping':
			return 'bg-yellow-500';
		case 'Stopped':
			return 'bg-red-500';
		default:
			return 'bg-neutral-500';
	}
}

function instanceStatusText(status: string) {
	switch (status) {
		case 'Running':
			return '运行中';
		case 'Starting':
			return '启动中';
		case 'Stopping':
			return '关闭中';
		case 'Stopped':
			return '已关闭';
		case 'Pending':
			return '初始化中';
		default:
			return '未知状态';
	}
}

function taskTypeLabel(type: string) {
	switch (type) {
		case 'test':
			return '测试';
		case 'deploy':
			return '部署';
		case 'backup':
			return '备份';
		case 'archive':
			return '归档';
		case 'create_instance':
			return '创建实例';
		case 'start_server':
			return '启动服务器';
		default:
			return type;
	}
}

// ---------- FuncList ----------

interface FuncListItem {
	name: string;
	action: () => void;
	icon: LucideIcon;
	disabled?: boolean;
}

function FuncList(props: { items: FuncListItem[] }) {
	return (
		<div className="flex flex-wrap gap-1 border rounded-full border-neutral-100">
			{props.items.map((x, i) => {
				const Icon = x.icon;
				return (
					<Tooltip title={x.name} key={i}>
						<span>
							<IconButton
								size="small"
								disabled={x.disabled}
								onClick={() => x.action()}
							>
								<Icon size={16} />
							</IconButton>
						</span>
					</Tooltip>
				);
			})}
		</div>
	);
}

// ---------- page ----------

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
	const [refreshingServerStatus, setRefreshingServerStatus] = useState(false);
	const [refreshingCandidates, setRefreshingCandidates] = useState(false);
	const [refreshingTasks, setRefreshingTasks] = useState(false);

	// Create instance dialog
	const [dialogOpen, setDialogOpen] = useState(false);
	const [createTaskId, setCreateTaskId] = useState<number | null>(null);
	const [deployTaskId, setDeployTaskId] = useState<number | null>(null);
	const [startTaskId, setStartTaskId] = useState<number | null>(null);
	const [taskRunning, setTaskRunning] = useState(false);
	const [serverStarting, setServerStarting] = useState(false);

	// SSE for live task output in the instance status card
	const createSSE = useTaskSSE(createTaskId);
	const deploySSE = useTaskSSE(deployTaskId);
	const startSSE = useTaskSSE(startTaskId);
	const activeOutputs = startTaskId
		? startSSE.outputs
		: deployTaskId
			? deploySSE.outputs
			: createSSE.outputs;
	const latestOutput =
		activeOutputs.length > 0 ? activeOutputs[activeOutputs.length - 1].output : null;

	// Deploy
	const [deployConfirmOpen, setDeployConfirmOpen] = useState(false);
	const [deployDialogOpen, setDeployDialogOpen] = useState(false);
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
	const srvSSE = useStateSSE<ServerStatus>(
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
	const serverQuery = useRef<ServerQuery>(undefined);

	async function fetchAll() {
		const [instRes, candRes, tasksRes, srvRes, instStatusRes, chartRes, idleRes, querySrvRes] =
			await Promise.all([
				getActiveInstance(),
				getCandidates(),
				getTasks({ limit: 5 }),
				getServerStatus(),
				getInstanceStatus(),
				getPlayerListHistory(),
				getIdleRemainingSecs(),
				queryServer()
			]);

		if (instRes.error === null) {
			setInstance(instRes.data);
			instanceNotFound.set(false);
		} else {
			instanceNotFound.set(true);
		}
		if (querySrvRes.error === null) serverQuery.current = querySrvRes.data;
		if (candRes.error === null) setCandidates(candRes.data!);
		if (tasksRes.error === null) {
			setTasks(tasksRes.data!.tasks);
			const runningCreate = tasksRes.data!.tasks.find(
				t => t.type === 'create_instance' && t.status === 'running'
			);
			const runningDeploy = tasksRes.data!.tasks.find(
				t => t.type === 'deploy' && t.status === 'running'
			);
			if (runningCreate || runningDeploy) {
				setCreateTaskId(runningCreate?.ID ?? null);
				setDeployTaskId(runningDeploy?.ID ?? null);
				setTaskRunning(true);
			}
			const runningStart = tasksRes.data!.tasks.find(
				t => t.type === 'start_server' && t.status === 'running'
			);
			const isServerOnline = srvRes.error === null && srvRes.data!.Value.online;
			if (runningStart) {
				setStartTaskId(runningStart.ID);
				setTaskRunning(true);
				if (!isServerOnline) {
					setServerStarting(true);
					startServerTriggeredRef.current = true;
				}
			}
		}
		if (srvRes.error === null) {
			serverOnline.set(srvRes.data!.Value.online);
			playerCount.set(srvRes.data!.Value.playerCount);
		}
		if (instStatusRes.error === null) instanceStatus.set(instStatusRes.data!.Value);
		if (chartRes.error === null) {
			chartData.set(
				chartRes.data!.map(p => ({
					time: new Date(p.time).toLocaleTimeString('zh-CN', {
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit'
					}),
					playerNames: p.playerNames
				}))
			);
		}
		if (idleRes.error === null) idleRemainingSecs.set(idleRes.data!);
	}

	async function fetchServerStatus() {
		setRefreshingServerStatus(true);
		try {
			const [srvRes, chartRes, idleRes] = await Promise.all([
				getServerStatus(),
				getPlayerListHistory(),
				getIdleRemainingSecs()
			]);
			if (srvRes.error === null) {
				serverOnline.set(srvRes.data!.Value.online);
				playerCount.set(srvRes.data!.Value.playerCount);
			}
			if (chartRes.error === null) {
				chartData.set(
					chartRes.data!.map(p => ({
						time: new Date(p.time).toLocaleTimeString('zh-CN', {
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit'
						}),
						playerNames: p.playerNames
					}))
				);
			}
			if (idleRes.error === null) idleRemainingSecs.set(idleRes.data!);
		} finally {
			setRefreshingServerStatus(false);
		}
	}

	async function fetchCandidates() {
		setRefreshingCandidates(true);
		try {
			const { data } = await getCandidates();
			if (data) setCandidates(data);
		} finally {
			setRefreshingCandidates(false);
		}
	}

	async function fetchTasks() {
		setRefreshingTasks(true);
		try {
			const { data } = await getTasks({ limit: 5 });
			if (data) setTasks(data.tasks);
		} finally {
			setRefreshingTasks(false);
		}
	}

	// Sync SSE values into named state
	useEffect(() => {
		if (srvSSE.value) {
			serverOnline.set(srvSSE.value.Value.online);
			playerCount.set(srvSSE.value.Value.playerCount);
		}
	}, [srvSSE.value]);

	useEffect(() => {
		if (instSSE.value) {
			instanceStatus.set(instSSE.value.Value);
		}
	}, [instSSE.value]);

	// Auto-refresh tasks when server becomes online after start_server trigger
	const fetchTasksRef = useRef(fetchTasks);
	fetchTasksRef.current = fetchTasks;
	useEffect(() => {
		if (srvSSE.value?.Value.online) {
			if (startServerTriggeredRef.current) {
				startServerTriggeredRef.current = false;
				fetchTasksRef.current();
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

	const isDeployed = instance?.isDeployed ?? false;

	const canStartServer = isDeployed && !serverOnline.current;
	const canStopServer = isDeployed && serverOnline.current;
	const canDeploy = !isDeployed;
	const canBackup = isDeployed;

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
		setDeployDialogOpen(true);
		fetchAll();
	}

	const serverActions: FuncListItem[] = [
		{
			name: '启动服务器',
			icon: PlayIcon,
			action: () => handleAction('启动服务器'),
			disabled: !canStartServer || (permissions !== null && !permissions.can_trigger_task)
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
			disabled: !canBackup || (permissions !== null && !permissions.can_run_backup)
		},
		{
			name: '归档',
			icon: ArchiveIcon,
			action: () => handleAction('归档'),
			disabled: !canBackup || (permissions !== null && !permissions.can_run_archive)
		}
	];

	return (
		<>
			{/* header */}
			<div className="flex items-center mb-6">
				<h1 className="text-3xl">Hi, {user?.username}</h1>
			</div>

			{user && !user.whitelist_uuid && (
				<Alert
					severity="info"
					className="mb-4"
					action={
						<div className="flex gap-2">
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
				{/* server status — full width, left 1/3 info + right 2/3 chart */}
				<Card variant="outlined">
					<CardContent>
						<div className="tracking-wider text-sm mb-4 flex items-center gap-2">
							<ServerIcon size={14} />
							服务器状态 / SERVER STATUS
							<div className="flex-1" />
							{!instanceNotFound.current && isDeployed && (
								<Tooltip title="刷新图表">
									<IconButton
										size="small"
										disabled={refreshingServerStatus}
										onClick={fetchServerStatus}
									>
										<RefreshCwIcon
											size={16}
											className={refreshingServerStatus ? 'animate-spin' : ''}
										/>
									</IconButton>
								</Tooltip>
							)}
						</div>
						{instanceNotFound.current || !isDeployed ? (
							<div className="flex flex-col items-center gap-3 py-8">
								<ServerIcon size={40} className="text-neutral-300" />
								<span className="text-neutral-500">请先创建并部署实例</span>
							</div>
						) : serverStarting ? (
							<div className="flex flex-col items-center gap-3 py-8">
								<Loader2Icon size={40} className="text-neutral-300 animate-spin" />
								<span className="text-neutral-500">正在启动服务器...</span>
							</div>
						) : (
							<div className="flex flex-col md:flex-row gap-4">
								{/* left: status info */}
								<div className="flex flex-col items-start gap-2">
									<div className="flex items-center gap-2">
										<div
											className={`w-2.5 h-2.5 rounded-full ${serverOnline.current ? 'bg-green-500' : 'bg-red-500'}`}
										/>
										<span className="text-xl font-bold">
											{serverOnline.current ? '在线' : '离线'}
										</span>
										{serverOnline.current && (
											<span className="text-xl">
												{playerCount.current}/20
											</span>
										)}
									</div>
									{serverQuery.current && (
										<Chip
											icon={
												serverQuery.current.platform.includes('Paper') ? (
													<img
														draggable="false"
														alt="papermc"
														src="/paper.svg"
														height="16px"
														width="16px"
													/>
												) : undefined
											}
											variant="outlined"
											label={serverQuery.current.platform}
										/>
									)}
									<div className="flex-1" />
									<FuncList items={serverActions} />
								</div>
								<div className="flex-1" />
								{/* right: chart */}
								<div className="min-w-0 grow basis-[66%]">
									<PlayerCountChart data={chartData.current} />
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* instance status — full width, left half status + right half spec/region */}
				<Card variant="outlined">
					<CardContent>
						<div className="tracking-wider text-sm mb-4 flex items-center gap-2">
							<HardDriveIcon size={14} />
							实例状态 / INSTANCE STATUS
							{!instanceNotFound.current && (
								<>
									<div className="flex-1" />
									<span className="font-mono text-xs">
										{instance?.instanceId ?? '—'}
									</span>
								</>
							)}
						</div>
						{taskRunning && !startTaskId ? (
							<div className="flex flex-col items-center gap-3 py-8">
								<Loader2Icon size={40} className="text-neutral-300 animate-spin" />
								<span className="text-neutral-500">
									{deployTaskId ? '实例部署中' : '实例创建中'}
								</span>
								{latestOutput && (
									<span className="text-xs text-neutral-400 font-mono max-w-md text-center truncate px-4">
										{latestOutput}
									</span>
								)}
								<Button
									size="small"
									variant="contained"
									onClick={() => {
										if (createTaskId) {
											setDialogOpen(true);
										} else {
											setDeployDialogOpen(true);
										}
									}}
								>
									查看进度
								</Button>
							</div>
						) : instanceNotFound.current ? (
							<div className="flex flex-col items-center gap-3 py-8">
								<HardDriveIcon size={40} className="text-neutral-300" />
								<span className="text-neutral-500">尚未创建实例</span>
								<Button
									variant="outlined"
									size="small"
									onClick={() => handleAction('创建实例')}
								>
									创建实例
								</Button>
							</div>
						) : (
							<div className="flex flex-col md:flex-row items-center gap-4">
								<div className="flex flex-col gap-3">
									<div className="flex items-center gap-2">
										<div
											className={`w-2.5 h-2.5 rounded-full ${instanceStatusColor(instanceStatus.current)}`}
										/>
										<span className="text-xl font-bold">
											{instanceStatusText(instanceStatus.current)}
										</span>
									</div>
									<FuncList items={instanceActions} />
								</div>
								<div className="flex-1" />
								<div className="md:w-1/2 grow justify-around flex gap-8">
									<div className="flex flex-col">
										<span className="text-xs text-neutral-400 mb-1">规格</span>
										<span className="text-xl font-bold">
											{instance?.instanceType ?? '—'}
										</span>
									</div>
									<div className="flex flex-col">
										<span className="text-xs text-neutral-400 mb-1">地域</span>
										<span className="text-xl font-bold">
											{instance?.zoneId ?? '—'}
										</span>
									</div>
									<div className="flex flex-col">
										<span className="text-xs text-neutral-400 mb-1">IP</span>
										<span className="text-xl font-bold">
											{instance?.ip ?? '—'}
										</span>
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* ecs candidates */}
				<Card variant="outlined">
					<CardContent>
						<div className="tracking-wider text-sm mb-4 flex items-center gap-2">
							<CpuIcon size={14} />
							ECS 候选实例 / ECS CANDIDATES
							<div className="flex-1" />
							<Tooltip title="刷新">
								<IconButton
									size="small"
									disabled={refreshingCandidates}
									onClick={fetchCandidates}
								>
									<RefreshCwIcon
										size={16}
										className={refreshingCandidates ? 'animate-spin' : ''}
									/>
								</IconButton>
							</Tooltip>
						</div>
						<TableContainer component={Paper} variant="outlined">
							<Table size="small" sx={{ tableLayout: { xs: 'auto', md: 'fixed' } }}>
								<TableHead>
									<TableRow>
										<TableCell align="center">实例规格</TableCell>
										<TableCell
											align="center"
											sx={{ display: { xs: 'none', md: 'table-cell' } }}
										>
											vCPU
										</TableCell>
										<TableCell
											align="center"
											sx={{ display: { xs: 'none', md: 'table-cell' } }}
										>
											内存 (GiB)
										</TableCell>
										<TableCell
											align="center"
											sx={{ display: { xs: 'none', md: 'table-cell' } }}
										>
											可用区
										</TableCell>
										<TableCell align="center">价格 (元/小时)</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{candidates.slice(0, 5).map((c, i) => (
										<TableRow key={i} hover>
											<TableCell align="center">
												<div className="flex justify-center items-center gap-2">
													{c.instanceType}
													{i === 0 && (
														<CheckIcon color="green" size={16} />
													)}
												</div>
											</TableCell>
											<TableCell
												align="center"
												sx={{ display: { xs: 'none', md: 'table-cell' } }}
											>
												{c.cpuCoreCount}
											</TableCell>
											<TableCell
												align="center"
												sx={{ display: { xs: 'none', md: 'table-cell' } }}
											>
												{c.memory}
											</TableCell>
											<TableCell
												align="center"
												sx={{ display: { xs: 'none', md: 'table-cell' } }}
											>
												{c.zoneId}
											</TableCell>
											<TableCell align="center">
												¥{c.tradePrice.toFixed(2)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
						<div className="mt-2 text-right">
							<Button size="small" component={Link} to="/info/ecs-candidates">
								查看全部
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* recent tasks */}
				<Card variant="outlined">
					<CardContent>
						<div className="tracking-wider text-sm mb-4 flex items-center gap-2">
							<ClockIcon size={14} />
							最近任务 / RECENT TASKS
							<div className="flex-1" />
							<Tooltip title="刷新">
								<IconButton
									size="small"
									disabled={refreshingTasks}
									onClick={fetchTasks}
								>
									<RefreshCwIcon
										size={16}
										className={refreshingTasks ? 'animate-spin' : ''}
									/>
								</IconButton>
							</Tooltip>
						</div>
						<TableContainer component={Paper} variant="outlined">
							<Table size="small" sx={{ tableLayout: { xs: 'auto', md: 'fixed' } }}>
								<TableHead>
									<TableRow>
										<TableCell align="center">类型</TableCell>
										<TableCell align="center">状态</TableCell>
										<TableCell
											align="center"
											sx={{ display: { xs: 'none', md: 'table-cell' } }}
										>
											耗时
										</TableCell>
										<TableCell align="center">创建时间</TableCell>
										<TableCell
											align="center"
											sx={{ display: { xs: 'none', md: 'table-cell' } }}
										>
											备注
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{tasks.slice(0, 5).map(task => (
										<TableRow key={task.ID} hover>
											<TableCell align="center">
												{taskTypeLabel(task.type)}
											</TableCell>
											<TableCell align="center">
												{taskStatusIcon(task.status)}
											</TableCell>
											<TableCell
												align="center"
												sx={{ display: { xs: 'none', md: 'table-cell' } }}
												className="text-neutral-500 text-sm"
											>
												{task.endAt && task.startAt
													? (
															(new Date(task.endAt).getTime() -
																new Date(task.startAt).getTime()) /
															1000
														).toFixed(1) + 's'
													: '—'}
											</TableCell>
											<TableCell
												align="center"
												className="text-neutral-500 text-sm"
											>
												<Tooltip title={Times.formatDate(task.CreatedAt)}>
													<span>{Times.formatFromNow(task.CreatedAt)}</span>
												</Tooltip>
											</TableCell>
											<TableCell
												align="center"
												sx={{ display: { xs: 'none', md: 'table-cell' } }}
												className="text-neutral-500 text-sm"
											>
												{task.error ? (
													<Tooltip title={task.error}>
														<span className="text-red-500 cursor-help">
															{task.error}
														</span>
													</Tooltip>
												) : (
													<span>—</span>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
						<div className="mt-2 text-right">
							<Button size="small" component={Link} to="/info/tasks">
								查看全部
							</Button>
						</div>
					</CardContent>
				</Card>
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

			<DeployDialog
				open={deployDialogOpen}
				onClose={() => setDeployDialogOpen(false)}
				onDeployed={() => fetchAll()}
				deployTaskId={deployTaskId}
				onDeployTaskIdChange={setDeployTaskId}
				onRunningChange={setTaskRunning}
			/>

			<CreateInstanceDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				bestCandidate={candidates[0] ?? null}
				onCreated={() => fetchAll()}
				onTaskChange={() => fetchAll()}
				createTaskId={createTaskId}
				onCreateTaskIdChange={setCreateTaskId}
				deployTaskId={deployTaskId}
				onDeployTaskIdChange={setDeployTaskId}
				startTaskId={startTaskId}
				onStartTaskIdChange={setStartTaskId}
				onRunningChange={setTaskRunning}
			/>
		</>
	);
}
