import { useState } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { RefreshCwIcon, ServerIcon, CopyIcon } from 'lucide-react';
import PlayerCountChart, { type PlayerListChartPoint } from '~/components/player-count-chart';
import EmptyState, { LoadingEmptyState } from '~/components/empty-state';
import { Toast } from '~/root';
import { instanceStatusColor, instanceStatusText } from '~/routes/home/utils';
import { getServerStatus } from '~/utils/requests/state';
import { getIdleRemainingSecs, getPlayerListHistory } from '~/utils/requests/home';
import { queryServer } from '~/utils/requests/server';
import type { NamedBooleanState } from '~/hooks/useStateNamed';

export type ServerStatusFetchResult = readonly [
	Awaited<ReturnType<typeof getServerStatus>>,
	Awaited<ReturnType<typeof getPlayerListHistory>>,
	Awaited<ReturnType<typeof getIdleRemainingSecs>>,
	Awaited<ReturnType<typeof queryServer>>
];

interface ServerStatusCardProps {
	notReady: boolean;
	starting: boolean;
	loading?: boolean;
	online: boolean;
	instanceStatus: string;
	playerCount: number;
	instanceType: string;
	zoneId: string;
	ip: string;
	chartData: PlayerListChartPoint[];
	onRefreshData?: (results: ServerStatusFetchResult) => void;
}

export const ServerStatus = {
	Card(props: ServerStatusCardProps) {
		const {
			notReady,
			starting,
			loading = false,
			online,
			instanceStatus,
			playerCount,
			instanceType,
			zoneId,
			ip,
			chartData,
			onRefreshData
		} = props;
		const [refreshing, setRefreshing] = useState(false);

		const isRunning = instanceStatus === 'Running';
		const statusText = isRunning ? (online ? '在线' : '离线') : instanceStatusText(instanceStatus);
		const statusColor = isRunning ? (online ? 'bg-green-500' : 'bg-red-500') : instanceStatusColor(instanceStatus);

		async function handleRefresh() {
			setRefreshing(true);
			try {
				const results = await ServerStatus.fetchData();
				onRefreshData?.(results);
			} finally {
				setRefreshing(false);
			}
		}

		return (
			<Card className="h-full">
				<CardContent className="flex flex-col h-full">
					{loading ? (
						<LoadingEmptyState
							className="flex-1"
							description={<span className="text-muted-foreground">加载中...</span>}
						/>
					) : notReady ? (
						<EmptyState
							icon={ServerIcon}
							iconSize={40}
							iconClassName="text-muted-foreground/30"
							description={<span className="text-muted-foreground">暂无可用实例</span>}
							className="py-12 flex-1"
						/>
					) : starting ? (
						<LoadingEmptyState
							className="flex-1"
							description={<span className="text-muted-foreground">正在启动服务器...</span>}
						/>
					) : (
						<div className="flex flex-col h-full">
							<div className="flex items-center justify-between mb-1">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">服务器</span>
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

							<div className="flex items-baseline gap-3 mb-2">
								<div className={`w-3 h-3 rounded-full shrink-0 ${statusColor}`} />
								<span className="text-xl font-bold tracking-tight">{statusText}</span>
								{online && (
									<span className="text-xl font-light text-muted-foreground">
										{playerCount}/20
									</span>
								)}
							</div>

							<div className="flex-1 min-h-0">
								<PlayerCountChart data={chartData} />
							</div>

							<div className="mt-6 pt-4 border-t border-border grid grid-cols-3 gap-3 text-base">
								<div className="flex flex-col">
									<span className="text-xs text-muted-foreground">规格</span>
									<span className="font-medium truncate">{instanceType || '—'}</span>
								</div>
								<div className="flex flex-col">
									<span className="text-xs text-muted-foreground">地域</span>
									<span className="font-medium truncate">{zoneId || '—'}</span>
								</div>
								<div className="flex flex-col">
									<span className="text-xs text-muted-foreground">IP 地址</span>
									<div className="flex items-center gap-1">
										<span className="font-medium font-mono">{ip || '—'}</span>
										{ip && (
											<Button
												variant="ghost"
												size="icon-xs"
												onClick={() => {
													navigator.clipboard.writeText(ip);
													Toast.success('已复制 IP 地址到剪贴板');
												}}
											>
												<CopyIcon />
											</Button>
										)}
									</div>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		);
	},
	async fetchData(loading?: NamedBooleanState) {
		loading?.set(true);
		const res = await Promise.all([
			getServerStatus(),
			getPlayerListHistory(),
			getIdleRemainingSecs(),
			queryServer()
		]);
		loading?.set(false);
		return res;
	}
};
