import { useCallback, useEffect, useState } from 'react';
import PaginatedTable, { type Column } from '~/components/paginated-table';
import type { Task } from '~/types/Task';
import { getTasks as fetchTasks, getTaskStats, getPlayerOnlineRanges, type TaskStats, type PlayerOnlineRangeRaw } from '~/utils/requests/home';
import { getTask } from '~/utils/requests/task';
import { Button } from '~/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import TaskTimelineChart from '~/components/task-timeline-chart';
import {
	CheckIcon,
	ClockIcon,
	Loader2Icon,
	XIcon
} from 'lucide-react';
import PageHeader from '~/components/page-header';
import { PAGE_NAME_TASK_LIST } from '~/consts/page-names';
import { Times } from '~/utils/times';

const System = '系统';

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

export function taskStatusIcon(status: string) {
	function icon() {
		switch (status) {
			case 'success':
				return <CheckIcon size={16} className="text-green-500" />;
			case 'running':
				return <Loader2Icon size={16} className="text-blue-500 animate-spin" />;
			case 'failed':
				return <XIcon size={16} className="text-red-500" />;
			default:
				return <ClockIcon size={16} />;
		}
	}
	return <div className="flex justify-center">{icon()}</div>;
}

function TimeCell({ ts }: { ts?: string }) {
	if (!ts) return <span className="text-muted-foreground">—</span>;
	return (
		<Tooltip>
			<TooltipTrigger>
				<span>{Times.formatFromNow(ts)}</span>
			</TooltipTrigger>
			<TooltipContent>{Times.formatDate(ts)}</TooltipContent>
		</Tooltip>
	);
}

function ClickableCell({ text, className }: { text: string; className?: string }) {
	const [open, setOpen] = useState(false);
	return (
		<>
			<span
				className={`text-xs max-w-20 inline-block truncate cursor-pointer text-center ${className ?? 'text-muted-foreground'}`}
				onClick={() => setOpen(true)}
			>
				{text}
			</span>
			<Dialog open={open} onOpenChange={v => setOpen(v)}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>详细信息</DialogTitle>
					</DialogHeader>
					<pre className="text-sm whitespace-pre-wrap break-all max-h-[60vh] overflow-y-auto">
						{text}
					</pre>
				</DialogContent>
			</Dialog>
		</>
	);
}

function ViewOutputBtn({ taskId }: { taskId: number }) {
	const [open, setOpen] = useState(false);
	const [output, setOutput] = useState<string | null>(null);
	const [fetching, setFetching] = useState(false);
	const [fetchError, setFetchError] = useState<string | null>(null);

	const handleOpen = useCallback(async () => {
		setOpen(true);
		setFetching(true);
		setFetchError(null);
		const res = await getTask(taskId);
		setFetching(false);
		if (res.error) {
			setFetchError(res.error);
		} else if (res.data) {
			setOutput(res.data.output || null);
		}
	}, [taskId]);

	return (
		<>
			<Button size="sm" variant="link" onClick={handleOpen}>
				查看
			</Button>
			<Dialog open={open} onOpenChange={v => setOpen(v)}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>输出内容</DialogTitle>
					</DialogHeader>
					{fetching ? (
						<div className="flex justify-center py-8">
							<Loader2Icon className="animate-spin text-muted-foreground" />
						</div>
					) : fetchError ? (
						<div className="text-red-500 text-sm py-4">{fetchError}</div>
					) : output ? (
						<pre className="text-sm whitespace-pre-wrap break-all max-h-[60vh] overflow-y-auto">
							{output}
						</pre>
					) : (
						<div className="text-muted-foreground text-sm py-4">暂无输出</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}

const columns: Column<Task>[] = [
	{ id: 'id', label: 'ID', render: t => t.ID, align: 'center' },
	{ id: 'type', label: '类型', render: t => taskTypeLabel(t.type), align: 'center' },
	{
		id: 'status',
		label: '状态',
		align: 'center',
		render: t => taskStatusIcon(t.status)
	},
	{
		id: 'created_at',
		label: '创建时间',
		align: 'center',
		render: t => <TimeCell ts={t.CreatedAt} />,
		sortable: true
	},
	{
		id: 'updated_at',
		label: '更新时间',
		align: 'center',
		render: t => <TimeCell ts={t.UpdatedAt} />,
		sortable: true
	},
	{
		id: 'duration',
		label: '耗时',
		align: 'center',
		render: t =>
			t.endAt && t.startAt
				? ((new Date(t.endAt).getTime() - new Date(t.startAt).getTime()) / 1000).toFixed(1) + 's'
				: <span className="text-muted-foreground">—</span>
	},
	{
		id: 'output',
		label: '输出',
		align: 'center',
		render: t => <ViewOutputBtn taskId={t.ID} />
	},
	{
		id: 'error',
		label: '错误',
		align: 'center',
		render: t =>
			t.error ? (
				<ClickableCell text={t.error} className="text-red-500" />
			) : (
				<span className="text-muted-foreground">—</span>
			)
	},
	{
		id: 'by',
		label: '创建者',
		align: 'center',
		render: t => t.user?.username ?? (t.by ? String(t.by) : System)
	}
];

export default function TasksPage() {
	const [rows, setRows] = useState<Task[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(0);
	const [pageSize, setPageSize] = useState(10);
	const [sort, setSort] = useState('created_at');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');
	const [stats, setStats] = useState<TaskStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [recentTasks, setRecentTasks] = useState<Task[]>([]);
	const [chartLoading, setChartLoading] = useState(true);
	const [onlineRanges, setOnlineRanges] = useState<PlayerOnlineRangeRaw[]>([]);
	const [timeRangeHours, setTimeRangeHours] = useState(6);

	const fetch = useCallback(async () => {
		setLoading(true);
		const res = await fetchTasks({
			limit: pageSize,
			offset: page * pageSize,
			sort,
			order
		});
		if (res.error === null) {
			setRows(res.data!.tasks);
			setTotal(res.data!.total);
		}
		setLoading(false);
	}, [page, pageSize, sort, order]);

	useEffect(() => {
		fetch();
	}, [fetch]);

	useEffect(() => {
		getTaskStats().then(res => {
			if (res.error === null) setStats(res.data!);
		});
	}, []);

	useEffect(() => {
		setChartLoading(true);

		const to = new Date().toISOString();
		const from = new Date(Date.now() - timeRangeHours * 3600 * 1000).toISOString();

		Promise.all([
			fetchTasks({ limit: 50, sort: 'created_at', order: 'desc' }).then(res => {
				if (res.error === null) setRecentTasks(res.data!.tasks);
			}),
			getPlayerOnlineRanges(from, to).then(res => {
				if (res.error === null) setOnlineRanges(res.data!);
			})
		]).finally(() => setChartLoading(false));
	}, [timeRangeHours]);

	const handleSortChange = useCallback((newSort: string, newOrder: 'asc' | 'desc') => {
		setSort(newSort);
		setOrder(newOrder);
		setPage(0);
	}, []);

	const successRate =
		stats && stats.total > 0 ? `${Math.round((stats.successCount / stats.total) * 100)}%` : '—';

	const lastCompletedAgo = stats?.lastCompletedAt
		? Times.formatFromNow(stats.lastCompletedAt)
		: '—';

	const lastCreator =
		stats?.lastCreatedUser?.username ??
		(stats?.lastCreatedBy ? String(stats.lastCreatedBy) : System);

	function lastByType(key: string): string {
		const ts = stats?.lastCompletedByType?.[key];
		return ts ? Times.formatFromNow(ts) : '—';
	}

	function lastByTypeRaw(key: string): string | undefined {
		return stats?.lastCompletedByType?.[key];
	}

	const statItems: { label: string; value: string | null; tooltip?: string }[] = [
		{ label: '任务总数', value: stats ? String(stats.total) : null },
		{ label: '成功率', value: stats ? successRate : null },
		{ label: '总运行时长', value: stats ? Times.formatRuntimeHours(stats.totalRuntimeSec) : null },
		{ label: '最近完成', value: stats ? lastCompletedAgo : null, tooltip: stats?.lastCompletedAt ? Times.formatDate(stats.lastCompletedAt) : undefined },
		{ label: '最近启动', value: stats ? lastByType('start_server') : null, tooltip: stats ? (lastByTypeRaw('start_server') ? Times.formatDate(lastByTypeRaw('start_server')!) : undefined) : undefined },
		{ label: '最近备份', value: stats ? lastByType('backup') : null, tooltip: stats ? (lastByTypeRaw('backup') ? Times.formatDate(lastByTypeRaw('backup')!) : undefined) : undefined },
		{ label: '最近归档', value: stats ? lastByType('archive') : null, tooltip: stats ? (lastByTypeRaw('archive') ? Times.formatDate(lastByTypeRaw('archive')!) : undefined) : undefined },
		{ label: '最近创建者', value: stats ? lastCreator : null }
	];

	const timeRangeOptions = [
		{ value: '1', label: '1 小时' },
		{ value: '6', label: '6 小时' },
		{ value: '12', label: '12 小时' },
		{ value: '24', label: '24 小时' },
		{ value: '48', label: '48 小时' },
		{ value: '72', label: '72 小时' },
	];

	return (
		<>
			<PageHeader>{PAGE_NAME_TASK_LIST}</PageHeader>
			<div className="flex flex-col gap-5">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
					<div className="grid grid-cols-2 gap-5 auto-rows-fr">
						{statItems.map((s, i) => (
							<Card key={i} size="sm" className="h-full justify-center">
								<CardContent className="flex flex-col gap-0.5">
									<span className="text-xs text-muted-foreground">{s.label}</span>
									{s.tooltip ? (
										<Tooltip>
											<TooltipTrigger asChild>
												<span className="text-2xl font-bold cursor-default">{s.value ?? '—'}</span>
											</TooltipTrigger>
											<TooltipContent>{s.tooltip}</TooltipContent>
										</Tooltip>
									) : (
										<span className="text-2xl font-bold">{s.value ?? '—'}</span>
									)}
								</CardContent>
							</Card>
						))}
					</div>
					<Card className="h-full">
						<CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
							<CardTitle className="tracking-wider text-sm font-normal text-muted-foreground">
								时间轴
							</CardTitle>
							<Select
								value={String(timeRangeHours)}
								onValueChange={v => setTimeRangeHours(Number(v))}
							>
								<SelectTrigger className="w-28 h-8 text-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{timeRangeOptions.map(opt => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</CardHeader>
						<CardContent className="flex-1 min-h-0">
							<TaskTimelineChart
								tasks={recentTasks.map(t => ({
									id: t.ID,
									type: t.type,
									startAt: t.startAt ?? '',
									endAt: t.endAt,
									status: t.status
								}))}
								playerRanges={onlineRanges}
								loading={chartLoading}
								timeRangeHours={timeRangeHours}
								style={{ height: '100%' }}
							/>
						</CardContent>
					</Card>
				</div>
				<PaginatedTable
					columns={columns}
					rows={rows}
					getRowKey={t => t.ID}
					total={total}
					page={page}
					pageSize={pageSize}
					sort={sort}
					order={order}
					loading={loading}
					onPageChange={setPage}
					onPageSizeChange={size => {
						setPageSize(size);
						setPage(0);
					}}
					onSortChange={handleSortChange}
				/>
			</div>
		</>
	);
}
