import { useCallback, useEffect, useState } from 'react';
import {
	Button,
	Card,
	CardContent,
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
import { ClockIcon, RefreshCwIcon } from 'lucide-react';
import { Link } from 'react-router';
import { CardLabel } from '~/components/card-label';
import EmptyState, { LoadingEmptyState } from '~/components/empty-state';
import { taskStatusIcon } from '~/routes/tasks';
import { taskTypeLabel } from '~/routes/home/utils';
import { Times } from '~/utils/times';
import type { Task } from '~/types/Task';
import type { NamedBooleanState } from '~/hooks/useStateNamed';
import { getTasks } from '~/utils/requests/home';

export type RecentTasksFetchResult = Awaited<ReturnType<typeof getTasks>>;

interface RecentTasksCardProps {
	tasks: Task[];
	loading?: boolean;
	refreshKey?: number;
	onRefreshData?: (result: RecentTasksFetchResult) => void;
}

export const RecentTasks = {
	Card(props: RecentTasksCardProps) {
		const { tasks, loading = false, refreshKey = 0, onRefreshData } = props;
		const [refreshing, setRefreshing] = useState(false);

		const handleRefresh = useCallback(async () => {
			setRefreshing(true);
			try {
				const result = await RecentTasks.fetchData();
				onRefreshData?.(result);
			} finally {
				setRefreshing(false);
			}
		}, [onRefreshData]);

		useEffect(() => {
			if (refreshKey > 0) {
				handleRefresh();
			}
		}, [refreshKey, handleRefresh]);

		return (
			<Card variant="outlined">
				<CardContent>
					<CardLabel
						icon={<ClockIcon size={14} />}
						actions={
							<Tooltip title="刷新">
								<IconButton size="small" disabled={refreshing} onClick={handleRefresh}>
									<RefreshCwIcon
										size={16}
										className={refreshing ? 'animate-spin' : ''}
									/>
								</IconButton>
							</Tooltip>
						}
					>
						最近任务
					</CardLabel>
					{loading ? (
						<LoadingEmptyState />
					) : tasks.length === 0 ? (
						<EmptyState
							description={<span className="text-neutral-500">暂无任务</span>}
							className="py-8"
						/>
					) : (
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
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
					<div className="mt-2 text-right">
						<Button size="small" component={Link} to="/info/tasks">
							查看全部
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	},
	async fetchData(loading?: NamedBooleanState) {
		loading?.set(true);
		const res = await getTasks({ limit: 5 });
		loading?.set(false);
		return res;
	}
};
