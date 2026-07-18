import { useCallback, useEffect, useState } from 'react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { ChevronRightIcon, FileTextIcon, RefreshCwIcon } from 'lucide-react';
import { Link } from 'react-router';
import EmptyState, { LoadingEmptyState } from '~/components/empty-state';
import { Times } from '~/utils/times';
import {
	getChangelogs,
	categoryText,
	type ChangelogItem
} from '~/utils/requests/changelog';

export type UpdateLogFetchResult = {
	items: ChangelogItem[];
	total: number;
};

interface UpdateLogCardProps {
	loading?: boolean;
	onRefreshData?: (result: UpdateLogFetchResult) => void;
}

export const UpdateLog = {
	Card(props: UpdateLogCardProps) {
		const { loading = false, onRefreshData } = props;
		const [refreshing, setRefreshing] = useState(false);
		const [items, setItems] = useState<ChangelogItem[]>([]);

		const handleRefresh = useCallback(async () => {
			setRefreshing(true);
			try {
				const result = await UpdateLog.fetchData();
				if (result.items) setItems(result.items);
				onRefreshData?.(result);
			} finally {
				setRefreshing(false);
			}
		}, [onRefreshData]);

		useEffect(() => {
			handleRefresh();
		}, []);

		return (
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="tracking-wider text-sm font-normal text-muted-foreground">更新日志</CardTitle>
					<CardAction>
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
					</CardAction>
				</CardHeader>
				<CardContent>
					{loading ? (
						<LoadingEmptyState className="py-8" />
					) : items.length === 0 ? (
						<EmptyState
							icon={FileTextIcon}
							iconSize={32}
							iconClassName="text-muted-foreground/30"
							description={<span className="text-muted-foreground text-sm">暂无更新日志</span>}
							className="py-6"
						/>
					) : (
						<div>
							<div className="flex flex-col gap-1.5">
								{items.slice(0, 5).map(item => (
									<Link
										key={item.id}
										to="/updates"
										state={{ openId: item.id }}
										className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded cursor-pointer hover:bg-muted/50 transition-colors"
									>
										<Badge variant="outline" className="shrink-0 text-xs">
											{categoryText(item.category)}
										</Badge>
										<span className="text-sm flex-1 truncate">
											{item.title}
										</span>
										<span className="text-xs text-muted-foreground shrink-0 tabular-nums">
											{Times.formatDate(item.created_at, 'M月D日')}
										</span>
									</Link>
								))}
							</div>

							<div className="mt-3 pt-2 border-t border-border">
								<Button
									size="sm"
									variant="ghost"
									className="w-full justify-between text-muted-foreground hover:text-foreground"
									asChild
								>
									<Link to="/updates">
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
	async fetchData(): Promise<UpdateLogFetchResult> {
		const { data } = await getChangelogs({ page: 1, pageSize: 5, sortBy: 'desc' });
		return {
			items: data?.items ?? [],
			total: data?.total ?? 0
		};
	}
};
