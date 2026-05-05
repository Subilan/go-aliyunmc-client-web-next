import { useCallback, useEffect, useState } from 'react';
import PaginatedTable, { type Column } from '~/components/paginated-table';
import type { Task } from '~/types/Task';
import { getTasks as fetchTasks } from '~/utils/requests/home';
import {
	Button,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	IconButton,
	Tooltip,
	Typography,
	Card,
	CardContent
} from '@mui/material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');
import { CheckCircleIcon, ClockIcon, Loader2Icon, XCircleIcon, XIcon } from 'lucide-react';

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

function TimeCell({ ts }: { ts?: string }) {
	if (!ts) return <span className="text-neutral-400">—</span>;
	const d = dayjs(ts);
	return (
		<Tooltip title={d.format('YYYY-MM-DD HH:mm:ss')}>
			<span>{d.fromNow()}</span>
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
		render: t => (
			<Chip
				icon={taskStatusIcon(t.status)}
				label={taskStatusLabel(t.status)}
				color={taskStatusColor(t.status)}
				size="small"
				variant={t.status === 'running' ? 'filled' : 'outlined'}
			/>
		)
	},
	// { id: 'step', label: '步骤', render: t => t.step, align: 'center' },
	{
		id: 'created_at',
		label: '创建时间',
		align: 'left',
		render: t => <TimeCell ts={t.CreatedAt} />,
		sortable: true
	},
	{
		id: 'updated_at',
		label: '更新时间',
		align: 'left',
		render: t => <TimeCell ts={t.UpdatedAt} />,
		sortable: true
	},
	{
		id: 'start_at',
		label: '开始时间',
		align: 'left',
		render: t => <TimeCell ts={t.startAt} />,
		sortable: true
	},
	{
		id: 'end_at',
		label: '结束时间',
		align: 'left',
		render: t => <TimeCell ts={t.endAt} />,
		sortable: true
	},
	{
		id: 'output',
		label: '输出',
		align: 'center',
		render: t =>
			t.output ? <ViewOutputBtn text={t.output} /> : <span className="text-neutral-400">—</span>
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
		render: t => t.user?.username ?? (t.by ? String(t.by) : 'sys')
	}
];

export default function TasksPage() {
	const [rows, setRows] = useState<Task[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(0);
	const [pageSize, setPageSize] = useState(10);
	const [sort, setSort] = useState('created_at');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');

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
	}, [page, pageSize, sort, order]);

	useEffect(() => {
		fetch();
	}, [fetch]);

	const handleSortChange = useCallback((newSort: string, newOrder: 'asc' | 'desc') => {
		setSort(newSort);
		setOrder(newOrder);
		setPage(0);
	}, []);

	return (
		<PaginatedTable
			columns={columns}
			rows={rows}
			getRowKey={t => t.ID}
			total={total}
			page={page}
			pageSize={pageSize}
			sort={sort}
			order={order}
			onPageChange={setPage}
			onPageSizeChange={size => {
				setPageSize(size);
				setPage(0);
			}}
			onSortChange={handleSortChange}
		/>
	);
}
