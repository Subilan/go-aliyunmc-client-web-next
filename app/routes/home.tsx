import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { Route } from './+types/home';
import { UserContext } from '~/contexts/user';
import {
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
	CheckCircleIcon,
	ClockIcon,
	CpuIcon,
	DatabaseIcon,
	DollarSignIcon,
	HardDriveIcon,
	InfoIcon,
	Loader2Icon,
	PlayIcon,
	RefreshCwIcon,
	RocketIcon,
	ServerIcon,
	SquareIcon,
	Trash2Icon,
	XCircleIcon,
	type LucideIcon
} from 'lucide-react';
import useStateNamed from '~/hooks/useStateNamed';
import { Toast } from '~/root';
import type { Instance } from '~/types/Instance';
import type { EcsCandidate } from '~/types/EcsCandidate';
import type { Task } from '~/types/Task';
import PlayerCountChart from '~/components/player-count-chart';
import type { ChartPoint } from '~/components/player-count-chart';
import CreateInstanceDialog from '~/components/create-instance-dialog';
import ConfirmTriggerDialog from '~/components/confirm-trigger-dialog';
import { getActiveInstance, getCandidates, deleteActiveInstance } from '~/utils/requests/instance';
import { getServerStatus, getInstanceStatus } from '~/utils/requests/state';
import {
	getTasks,
	getBalance,
	getPlayerCountHistory,
	getIdleRemainingSecs
} from '~/utils/requests/home';
import { triggerTask } from '~/utils/requests/task';
import { useTaskSSE } from '~/hooks/useTaskSSE';

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

function taskStatusColor(status: string): 'success' | 'warning' | 'error' | 'info' {
	switch (status) {
		case 'success':
			return 'success';
		case 'running':
			return 'info';
		case 'failed':
			return 'error';
		default:
			return 'warning';
	}
}

function taskStatusIcon(status: string) {
	switch (status) {
		case 'success':
			return <CheckCircleIcon size={14} />;
		case 'running':
			return <Loader2Icon size={14} className="animate-spin" />;
		case 'failed':
			return <XCircleIcon size={14} />;
		default:
			return <ClockIcon size={14} />;
	}
}

function taskStatusLabel(status: string) {
	switch (status) {
		case 'success':
			return '成功';
		case 'running':
			return '运行中';
		case 'failed':
			return '失败';
		default:
			return '已创建';
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
		<>
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
		</>
	);
}

// ---------- page ----------

export function meta({}: Route.MetaArgs) {
	return [{ title: '控制台 - Seatide' }, { name: 'description', content: 'Seatide 玩家控制台' }];
}

export default function Home() {
	const user = useContext(UserContext);

	const [instance, setInstance] = useState<Instance | null>(null);
	const [candidates, setCandidates] = useState<EcsCandidate[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const instanceNotFound = useStateNamed(false);

	const instanceStatus = useStateNamed('...');
	const serverOnline = useStateNamed(false);
	const playerCount = useStateNamed(0);
	const idleRemainingSecs = useStateNamed(-1);
	const accountBalance = useStateNamed(0);
	const chartData = useStateNamed<ChartPoint[]>([]);
	const [refreshingCandidates, setRefreshingCandidates] = useState(false);
	const [refreshingTasks, setRefreshingTasks] = useState(false);

	// Create instance dialog
	const [dialogOpen, setDialogOpen] = useState(false);
	const [createTaskId, setCreateTaskId] = useState<number | null>(null);
	const [deployTaskId, setDeployTaskId] = useState<number | null>(null);
	const [taskRunning, setTaskRunning] = useState(false);

	// SSE for live task output in the instance status card
	const createSSE = useTaskSSE(createTaskId);
	const deploySSE = useTaskSSE(deployTaskId);
	const activeOutputs = deployTaskId ? deploySSE.outputs : createSSE.outputs;
	const latestOutput =
		activeOutputs.length > 0 ? activeOutputs[activeOutputs.length - 1].output : null;

	// Delete instance dialog
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Backup / Archive confirmation dialogs
	const [backupOpen, setBackupOpen] = useState(false);
	const [archiveOpen, setArchiveOpen] = useState(false);
	const [backupTriggering, setBackupTriggering] = useState(false);
	const [archiveTriggering, setArchiveTriggering] = useState(false);

	async function fetchAll() {
		const [instRes, candRes, tasksRes, srvRes, instStatusRes, balRes, chartRes, idleRes] =
			await Promise.all([
				getActiveInstance(),
				getCandidates(),
				getTasks({ limit: 5 }),
				getServerStatus(),
				getInstanceStatus(),
				getBalance(),
				getPlayerCountHistory(),
				getIdleRemainingSecs()
			]);

		if (instRes.error === null) {
			setInstance(instRes.data);
		} else {
			instanceNotFound.set(true);
		}
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
		}
		if (srvRes.error === null) {
			serverOnline.set(srvRes.data!.Value.online);
			playerCount.set(srvRes.data!.Value.playerCount);
		}
		if (instStatusRes.error === null) instanceStatus.set(instStatusRes.data!.Value);
		if (balRes.error === null) accountBalance.set(balRes.data!);
		if (chartRes.error === null) {
			chartData.set(
				chartRes.data!.map(p => ({
					time: new Date(p.time).toLocaleTimeString('zh-CN', {
						hour: '2-digit',
						minute: '2-digit'
					}),
					count: p.playerCount
				}))
			);
		}
		if (idleRes.error === null) idleRemainingSecs.set(idleRes.data!);
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

	const serverActions: FuncListItem[] = [
		{
			name: '启动服务器',
			icon: PlayIcon,
			action: () => handleAction('启动服务器'),
			disabled: !canStartServer
		},
		{
			name: '停止服务器',
			icon: SquareIcon,
			action: () => handleAction('停止服务器'),
			disabled: !canStopServer
		},
		{ name: '详细信息', icon: InfoIcon, action: () => handleAction('详细信息') }
	];

	const instanceActions: FuncListItem[] = [
		{ name: '启动实例', icon: PlayIcon, action: () => handleAction('创建实例') },
		{ name: '关闭实例', icon: SquareIcon, action: () => handleAction('创建实例') },
		{
			name: '部署',
			icon: RocketIcon,
			action: () => handleAction('部署'),
			disabled: !canDeploy
		},
		{ name: '删除实例', icon: Trash2Icon, action: () => handleAction('删除实例') },
		{
			name: '备份',
			icon: DatabaseIcon,
			action: () => handleAction('备份'),
			disabled: !canBackup
		},
		{ name: '归档', icon: ArchiveIcon, action: () => handleAction('归档'), disabled: !canBackup }
	];

	return (
		<>
			{/* header */}
			<div className="flex items-center mb-6">
				<h1 className="text-3xl">Hi, {user?.username}</h1>
				<div className="flex-1" />
				<div className="flex items-center gap-3">
					<Chip
						icon={<DollarSignIcon size={14} />}
						label={`余额 ¥${accountBalance.current.toFixed(2)}`}
						variant="outlined"
						size="small"
					/>
				</div>
			</div>

			<div className="flex flex-col gap-4">
				{/* server status — full width, left 1/3 info + right 2/3 chart */}
				<Card variant="outlined">
					<CardContent>
						<div className="tracking-wider text-sm mb-4 flex items-center gap-2">
							<ServerIcon size={14} />
							服务器状态 / SERVER STATUS
						</div>
						{instanceNotFound.current || !isDeployed ? (
							<div className="flex flex-col items-center gap-3 py-8">
								<ServerIcon size={40} className="text-gray-300" />
								<span className="text-gray-500">请先创建并部署实例</span>
							</div>
						) : (
							<div className="flex flex-col md:flex-row gap-4">
								{/* left: status info */}
								<div className="md:w-1/3 flex flex-col gap-2">
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
									<div className="flex-1" />
									<div className="flex flex-wrap gap-1">
										<FuncList items={serverActions} />
									</div>
								</div>
								{/* right: chart */}
								<div className="md:w-2/3 min-w-0">
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
						{taskRunning ? (
							<div className="flex flex-col items-center gap-3 py-8">
								<Loader2Icon size={40} className="text-gray-300 animate-spin" />
								<span className="text-gray-500">
									{deployTaskId ? '实例部署中' : '实例创建中'}
								</span>
								{latestOutput && (
									<span className="text-xs text-gray-400 font-mono max-w-md text-center truncate px-4">
										{latestOutput}
									</span>
								)}
								<Button
									size="small"
									variant="contained"
									onClick={() => setDialogOpen(true)}
								>
									查看进度
								</Button>
							</div>
						) : instanceNotFound.current ? (
							<div className="flex flex-col items-center gap-3 py-8">
								<HardDriveIcon size={40} className="text-gray-300" />
								<span className="text-gray-500">尚未创建实例</span>
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
									<div className="flex flex-wrap gap-1 border rounded-full border-neutral-100">
										<FuncList items={instanceActions} />
									</div>
								</div>
								<div className="flex-1" />
								<div className="md:w-1/2 grow justify-around flex gap-8">
									<div className="flex flex-col">
										<span className="text-xs text-gray-400 mb-1">规格</span>
										<span className="text-xl font-bold">
											{instance?.instanceType ?? '—'}
										</span>
									</div>
									<div className="flex flex-col">
										<span className="text-xs text-gray-400 mb-1">地域</span>
										<span className="text-xl font-bold">
											{instance?.zoneId ?? '—'}
										</span>
									</div>
									<div className="flex flex-col">
										<span className="text-xs text-gray-400 mb-1">IP</span>
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
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell align="center">实例规格</TableCell>
										<TableCell align="center">vCPU</TableCell>
										<TableCell align="center">内存 (GiB)</TableCell>
										<TableCell align="center">可用区</TableCell>
										<TableCell align="center">价格 (元/小时)</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{candidates.slice(0, 5).map((c, i) => (
										<TableRow key={i} hover>
											<TableCell align="center">
												<div className="flex justify-center items-center gap-2">
													<code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
														{c.instanceType}
													</code>
													{i === 0 && (
														<Chip
															label="最优"
															color="primary"
															size="small"
														/>
													)}
												</div>
											</TableCell>
											<TableCell align="center">{c.cpuCoreCount}</TableCell>
											<TableCell align="center">{c.memory}</TableCell>
											<TableCell align="center">{c.zoneId}</TableCell>
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
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell align="center">类型</TableCell>
										<TableCell align="center">状态</TableCell>
										<TableCell align="center">时间</TableCell>
										<TableCell align="center">备注</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{tasks.slice(0, 5).map(task => (
										<TableRow key={task.ID} hover>
											<TableCell align="center">
												{taskTypeLabel(task.type)}
											</TableCell>
											<TableCell align="center">
												<Chip
													icon={taskStatusIcon(task.status)}
													label={taskStatusLabel(task.status)}
													color={taskStatusColor(task.status)}
													size="small"
													variant="outlined"
												/>
											</TableCell>
											<TableCell
												align="center"
												className="text-gray-500 text-sm"
											>
												{new Date(task.CreatedAt).toLocaleString('zh-CN', {
													month: '2-digit',
													day: '2-digit',
													hour: '2-digit',
													minute: '2-digit'
												})}
											</TableCell>
											<TableCell
												align="center"
												className="text-gray-500 text-sm"
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
				onRunningChange={setTaskRunning}
			/>
		</>
	);
}
