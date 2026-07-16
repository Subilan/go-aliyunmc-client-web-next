import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { ClockIcon, RefreshCwIcon, ChevronRightIcon } from 'lucide-react';
import { Link } from 'react-router';
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
			<Card className="h-full">
				<CardContent className="flex flex-col h-full">
					{loading ? (
						<LoadingEmptyState className="flex-1" />
					) : tasks.length === 0 ? (
						<EmptyState
							icon={ClockIcon}
							iconSize={32}
							iconClassName="text-muted-foreground/30"
							description={<span className="text-muted-foreground text-sm">暂无活动</span>}
							className="py-6"
						/>
					) : (
						<div className="flex flex-col flex-1">
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									最近活动
								</span>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon-xs"
											disabled={refreshing}
											onClick={handleRefresh}
										>
											<RefreshCwIcon
												className={refreshing ? 'animate-spin' : ''}
											/>
										</Button>
									</TooltipTrigger>
									<TooltipContent>刷新</TooltipContent>
								</Tooltip>
							</div>

							<div className="flex flex-col gap-1">
								{tasks.slice(0, 5).map(task => (
									<div
										key={task.ID}
										className="flex items-center gap-2 py-1.5"
									>
										<span className="text-muted-foreground shrink-0">
											{taskStatusIcon(task.status)}
										</span>
										<span className="text-sm flex-1 truncate">
											{taskTypeLabel(task.type)}
										</span>
										<Tooltip>
											<TooltipTrigger asChild>
												<span className="text-xs text-muted-foreground shrink-0 tabular-nums">
													{Times.formatFromNow(task.CreatedAt)}
												</span>
											</TooltipTrigger>
											<TooltipContent>
												{Times.formatDate(task.CreatedAt)}
											</TooltipContent>
										</Tooltip>
									</div>
								))}
							</div>

							<div className="mt-auto pt-2 border-t border-border">
								<Button
									size="sm"
									variant="ghost"
									className="w-full justify-between text-muted-foreground hover:text-foreground"
									asChild
								>
									<Link to="/info/tasks">
										查看全部
										<ChevronRightIcon />
									</Link>
								</Button>
							</div>
						</div>
					)}
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
