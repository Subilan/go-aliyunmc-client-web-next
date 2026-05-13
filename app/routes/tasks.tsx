import { useCallback, useEffect, useState } from 'react';
import PaginatedTable, { type Column } from '~/components/paginated-table';
import type { Task } from '~/types/Task';
import { getTasks as fetchTasks, getTaskStats, type TaskStats } from '~/utils/requests/home';
import {
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	IconButton,
	Tooltip,
	Typography,
	Card,
	CardContent} from '@mui/material';
import MetricCard from '~/components/metric-card';
import {
	CheckIcon,
	ClockIcon,
	Loader2Icon,
	XIcon
} from 'lucide-react';
import PageHeader from '~/components/page-header';
import { PAGE_NAME_TASK_LIST } from '~/consts/page-names';
import { Times } from '~/utils/times';

const System = '系统'

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
				return <CheckIcon size={16} color="green" />;
			case 'running':
				return <Loader2Icon size={16} color="blue" className="animate-spin" />;
			case 'failed':
				return <XIcon size={16} color="red" />;
			default:
				return <ClockIcon size={16} />;
		}
	}
	return <div className="flex justify-center">{icon()}</div>;
}

function TimeCell({ ts }: { ts?: string }) {
	if (!ts) return <span className="text-neutral-400">—</span>;
	return (
		<Tooltip title={Times.formatDate(ts)}>
			<span>{Times.formatFromNow(ts)}</span>
		</Tooltip>
	);
}

function ClickableCell({ text, className }: { text: string; className?: string }) {
	const [open, setOpen] = useState(false);
	return (
		<>
			<span
				className={`text-xs max-w-20 block truncate cursor-pointer ${className ?? 'text-neutral-500'}`}
				onClick={() => setOpen(true)}
			>
				{text}
			</span>
			<Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle
					sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
				>
					详细信息
					<IconButton size="small" onClick={() => setOpen(false)}>
						<XIcon size={18} />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<Typography
						component="pre"
						sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14 }}
					>
						{text}
					</Typography>
				</DialogContent>
			</Dialog>
		</>
	);
}

function ViewOutputBtn({ text }: { text: string }) {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button size="small" variant="text" onClick={() => setOpen(true)}>
				查看
			</Button>
			<Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle
					sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
				>
					输出内容
					<IconButton size="small" onClick={() => setOpen(false)}>
						<XIcon size={18} />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<Card variant="outlined">
						<CardContent className="overflow-y-auto">
							<pre>
								<code>{text}</code>
							</pre>
						</CardContent>
					</Card>
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
	// { id: 'step', label: '步骤', render: t => t.step, align: 'center' },
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
				: <span className="text-neutral-400">—</span>
	},
	{
		id: 'output',
		label: '输出',
		align: 'center',
		render: t =>
			t.output ? (
				<ViewOutputBtn text={t.output} />
			) : (
				<span className="text-neutral-400">—</span>
			)
	},
	{
		id: 'error',
		label: '错误',
		align: 'center',
		render: t =>
			t.error ? (
				<ClickableCell text={t.error} className="text-red-500" />
			) : (
				<span className="text-neutral-400">—</span>
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
	const [initialLoading, setInitialLoading] = useState(true);

	const fetch = useCallback(async () => {
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
		setInitialLoading(false);
	}, [page, pageSize, sort, order]);

	useEffect(() => {
		fetch();
	}, [fetch]);

	useEffect(() => {
		getTaskStats().then(res => {
			if (res.error === null) setStats(res.data!);
		});
	}, []);

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

	return (
		<>
			<PageHeader>{PAGE_NAME_TASK_LIST}</PageHeader>
			<div className="flex flex-col gap-3">
				<MetricCard
					cols={4}
					metrics={[
						{
							label: '任务总数',
							value: stats ? String(stats.total) : null,
							loading: !stats
						},
						{ label: '成功率', value: stats ? successRate : null, loading: !stats },
						{
							label: '最近完成',
							value: stats ? lastCompletedAgo : null,
							loading: !stats
						},
						{
							label: '最近创建者',
							value: lastCreator,
							loading: !stats
						}
					]}
				/>
				<PaginatedTable
					columns={columns}
					rows={rows}
					getRowKey={t => t.ID}
					total={total}
					page={page}
					pageSize={pageSize}
					sort={sort}
					order={order}
					loading={initialLoading}
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
