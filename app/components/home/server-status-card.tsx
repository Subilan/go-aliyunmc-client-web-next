import { useState } from 'react';
import { Card, CardContent, Chip, IconButton, Tooltip } from '@mui/material';
import { RefreshCwIcon, ServerIcon } from 'lucide-react';
import { CardLabel } from '~/components/card-label';
import { FuncList, type FuncListItem } from '~/components/func-list';
import PlayerCountChart, { type PlayerListChartPoint } from '~/components/player-count-chart';
import EmptyState, { LoadingEmptyState } from '~/components/empty-state';
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
	playerCount: number;
	platform: string | undefined;
	isPaper: boolean;
	chartData: PlayerListChartPoint[];
	serverActions: FuncListItem[];
	onRefreshData?: (results: ServerStatusFetchResult) => void;
}

export const ServerStatus = {
	Card(props: ServerStatusCardProps) {
		const {
			notReady,
			starting,
			loading = false,
			online,
			playerCount,
			platform,
			isPaper,
			chartData,
			serverActions,
			onRefreshData
		} = props;
		const [refreshing, setRefreshing] = useState(false);

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
			<Card variant="outlined">
				<CardContent>
					<CardLabel
						icon={<ServerIcon size={14} />}
						actions={
							!notReady ? (
								<Tooltip title="刷新图表">
									<IconButton size="small" disabled={refreshing} onClick={handleRefresh}>
										<RefreshCwIcon
											size={16}
											className={refreshing ? 'animate-spin' : ''}
										/>
									</IconButton>
								</Tooltip>
							) : undefined
						}
					>
						服务器状态
					</CardLabel>
					{loading ? (
						<LoadingEmptyState
							description={<span className="text-neutral-500">加载中...</span>}
						/>
					) : notReady ? (
						<EmptyState
							icon={ServerIcon}
							iconSize={40}
							iconClassName="text-neutral-300"
							description={<span className="text-neutral-500">请先创建并部署实例</span>}
							className="py-8"
						/>
					) : starting ? (
						<LoadingEmptyState
							description={<span className="text-neutral-500">正在启动服务器...</span>}
						/>
					) : (
						<div className="flex flex-col md:flex-row gap-4">
							<div className="flex flex-col items-start gap-2">
								<div className="flex items-center gap-2">
									<div
										className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`}
									/>
									<span className="text-xl font-bold">
										{online ? '在线' : '离线'}
									</span>
									{online && <span className="text-xl">{playerCount}/20</span>}
								</div>
								{platform && (
									<Chip
										icon={
											isPaper ? (
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
										label={platform}
									/>
								)}
								<div className="flex-1" />
								<FuncList items={serverActions} />
							</div>
							<div className="flex-1" />
							<div className="min-w-0 grow basis-[66%]">
								<PlayerCountChart data={chartData} />
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
