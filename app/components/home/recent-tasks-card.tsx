import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table';
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
			<Card>
				<CardContent>
					<CardLabel
						icon={<ClockIcon size={14} />}
						actions={
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-xs"
										disabled={refreshing}
										onClick={handleRefresh}
									>
										<RefreshCwIcon
											data-icon="inline-start"
											className={refreshing ? 'animate-spin' : ''}
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent>刷新</TooltipContent>
							</Tooltip>
						}
					>
						最近任务
					</CardLabel>
					{loading ? (
						<LoadingEmptyState />
					) : tasks.length === 0 ? (
						<EmptyState
							description={<span className="text-muted-foreground">暂无任务</span>}
							className="py-8"
						/>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="text-center">类型</TableHead>
									<TableHead className="text-center">状态</TableHead>
									<TableHead className="text-center hidden md:table-cell">耗时</TableHead>
									<TableHead className="text-center">创建时间</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{tasks.slice(0, 5).map(task => (
									<TableRow key={task.ID}>
										<TableCell className="text-center">
											{taskTypeLabel(task.type)}
										</TableCell>
										<TableCell className="text-center">
											{taskStatusIcon(task.status)}
										</TableCell>
										<TableCell className="text-center hidden md:table-cell text-muted-foreground text-sm">
											{task.endAt && task.startAt
												? (
														(new Date(task.endAt).getTime() -
															new Date(task.startAt).getTime()) /
														1000
													).toFixed(1) + 's'
												: '—'}
										</TableCell>
										<TableCell className="text-center text-muted-foreground text-sm">
											<Tooltip>
												<TooltipTrigger>
													<span>{Times.formatFromNow(task.CreatedAt)}</span>
												</TooltipTrigger>
												<TooltipContent>
													{Times.formatDate(task.CreatedAt)}
												</TooltipContent>
											</Tooltip>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
					<div className="mt-2 text-right">
						<Button size="sm" variant="link" asChild>
							<Link to="/info/tasks">查看全部</Link>
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
