import { Card, CardContent, Chip, IconButton, Tooltip } from '@mui/material';
import { Loader2Icon, RefreshCwIcon, ServerIcon } from 'lucide-react';
import { CardLabel } from '~/components/card-label';
import { FuncList, type FuncListItem } from '~/components/func-list';
import PlayerCountChart, { type PlayerListChartPoint } from '~/components/player-count-chart';

interface ServerStatusCardProps {
	notReady: boolean;
	starting: boolean;
	online: boolean;
	playerCount: number;
	platform: string | undefined;
	isPaper: boolean;
	chartData: PlayerListChartPoint[];
	refreshing: boolean;
	serverActions: FuncListItem[];
	onRefresh: () => void;
}

export default function ServerStatusCard(props: ServerStatusCardProps) {
	const {
		notReady,
		starting,
		online,
		playerCount,
		platform,
		isPaper,
		chartData,
		refreshing,
		serverActions,
		onRefresh
	} = props;

	return (
		<Card variant="outlined">
			<CardContent>
				<CardLabel
					icon={<ServerIcon size={14} />}
					actions={
						!notReady ? (
							<Tooltip title="刷新图表">
								<IconButton
									size="small"
									disabled={refreshing}
									onClick={onRefresh}
								>
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
				{notReady ? (
					<div className="flex flex-col items-center gap-3 py-8">
						<ServerIcon size={40} className="text-neutral-300" />
						<span className="text-neutral-500">请先创建并部署实例</span>
					</div>
				) : starting ? (
					<div className="flex flex-col items-center gap-3 py-8">
						<Loader2Icon size={40} className="text-neutral-300 animate-spin" />
						<span className="text-neutral-500">正在启动服务器...</span>
					</div>
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
								{online && (
									<span className="text-xl">
										{playerCount}/20
									</span>
								)}
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
}
