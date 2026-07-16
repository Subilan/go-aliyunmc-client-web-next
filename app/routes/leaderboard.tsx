import { useEffect } from 'react';
import type { MetaArgs } from 'react-router';
import { Card, CardContent } from '~/components/ui/card';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table';

import { PAGE_NAME_LEADERBOARD } from '~/consts/page-names';
import { Req } from '~/utils/requests/Req';
import type { LeaderboardEntry } from '~/utils/requests/game';
import useStateNamed from '~/hooks/useStateNamed';
import { Toast } from '~/root';
import EmptyState, { LoadingEmptyState } from '~/components/empty-state';
import PageHeader from '~/components/page-header';

const METRICS: Record<string, { label: string; unit: string; decimals: number; divisor: number }> =
	{
		minecraft_playtime: { label: '游戏时长', unit: '小时', decimals: 1, divisor: 3600 * 20 },
		achievements: { label: '成就数量', unit: '个', decimals: 0, divisor: 1 },
		distance: { label: '移动距离', unit: 'km', decimals: 2, divisor: 1 },
		mob_kills: { label: '生物击杀', unit: '个', decimals: 0, divisor: 1 },
		blocks_mined: { label: '挖掘方块', unit: '个', decimals: 0, divisor: 1 },
		avg_move_distance: { label: '平均移速', unit: 'km/h', decimals: 2, divisor: 1 },
		login_days: { label: '登录天数', unit: '天', decimals: 0, divisor: 1 },
		join_streak: { label: '连续登录', unit: '天', decimals: 0, divisor: 1 }
	};

const PODIUM_COLORS = [
	{ border: '', text: '' },
	{ border: 'border-t-amber-400', text: 'text-amber-600' },
	{ border: 'border-t-slate-300', text: 'text-slate-500' },
	{ border: 'border-t-orange-400', text: 'text-orange-600' }
];

function PodiumCard({
	entry,
	rank,
	formattedValue,
	unit
}: {
	entry: LeaderboardEntry;
	rank: number;
	formattedValue: string;
	unit: string;
}) {
	const colors = PODIUM_COLORS[rank];
	const isFirst = rank === 1;
	return (
		<Card
			className={`w-full ${isFirst ? 'sm:h-52 sm:w-42' : 'sm:h-40 sm:w-36'} ${colors.border} border-l-4 sm:border-l-0 sm:border-t-4`}
		>
			<CardContent className="flex flex-row sm:flex-col items-center sm:justify-center sm:h-full gap-1.5 py-3 sm:py-4">
				<div className={`sm:text-lg font-bold tracking-wider shrink-0 ${colors.text}`}>
					#{rank}
				</div>
				<div
					className={`flex-1 sm:flex-none min-w-0 sm:text-lg ${isFirst ? 'sm:text-xl' : ''} font-medium truncate`}
				>
					{entry.player_name}
				</div>
				<div className="flex flex-row sm:flex-col items-baseline sm:items-center gap-1 sm:gap-0 shrink-0">
					<span
						className={`text-xl ${isFirst ? 'sm:text-3xl' : 'sm:text-2xl'} font-bold leading-none`}
					>
						{formattedValue}
					</span>
					<span className="text-xs text-muted-foreground sm:mt-1">{unit}</span>
				</div>
			</CardContent>
		</Card>
	);
}

function LeaderboardInfo() {
	return (
		<>
			<p>
				排行榜使用 Minecraft
				内置的玩家数据对进入过服务器的玩家进行排名，其目的是直观地展示全服务器玩家的游戏进展情况。
			</p>
			<p>排行榜数据更新有 5 分钟延迟，并且当服务器不在线时，不会进行同步。</p>
			<h4>不参与排行榜</h4>
			<p>
				如果你不希望自己的游戏名出现在排行榜中，可以在【个人资料→偏好设置】中将"参与排行榜"一项关闭，此设置将立即生效。
			</p>
			<h4>指标解释</h4>
			<p>排行榜提供下列指标的排序：</p>
			<ul>
				<li>游戏时长：进行游戏的总时长，含挂机时间，但不包含暂停游戏的时间。</li>
				<li>成就数量：完成的游戏成就的数量。</li>
				<li>移动距离：在游戏中移动的累计距离，一米对应一格。</li>
				<li>生物击杀：在游戏中击杀的生物总数。</li>
				<li>挖掘方块：在游戏中挖掘（鼠标左键）的方块总数，含作物收割等。</li>
				<li>
					平均移速：总移动距离除以总游戏时长得到的一个理论上的平均移动速度，该指标的大小近乎对应了玩家在游戏过程中静止或移动时间占游戏时长的比例，但其描述的准确性取决于游戏时长大小。若游戏时长过短，此项不准确。
				</li>
				<li>登录天数：进入过服务器的不同日期总数。</li>
				<li>连续登录：最长连续登录（每天至少上线过一次）的天数。</li>
			</ul>
			<p>注意：登录相关数据的开始时间为 2026 年 5 月 12 日。</p>
		</>
	);
}

export function meta({}: MetaArgs) {
	return [
		{ title: PAGE_NAME_LEADERBOARD + ' - Seatide' },
		{ name: 'description', content: '浏览服务器玩家各项指标的排行榜。' }
	];
}

export default function Leaderboard() {
	const metric = useStateNamed('minecraft_playtime');
	const entries = useStateNamed<LeaderboardEntry[]>([]);
	const loading = useStateNamed(true);

	useEffect(() => {
		loading.set(true);
		Req.getLeaderboard(metric.current).then(res => {
			loading.set(false);
			if (res.error === null) {
				entries.set(res.data!);
			} else {
				Toast.error(typeof res.error === 'string' ? res.error : '获取排行榜失败');
			}
		});
	}, [metric.current]);

	const first = entries.current[0];
	const second = entries.current[1];
	const third = entries.current[2];
	const rest = entries.current.slice(3);

	const metricInfo = METRICS[metric.current];

	function formatValue(value: number): string {
		return (value / metricInfo.divisor).toFixed(metricInfo.decimals);
	}

	return (
		<>
			<div className="flex items-center mb-6">
				<PageHeader info={LeaderboardInfo()}>{PAGE_NAME_LEADERBOARD}</PageHeader>
				<div className="flex-1" />
				<Select value={metric.current} onValueChange={v => metric.set(v)}>
					<SelectTrigger className="w-[130px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{Object.entries(METRICS).map(([key, m]) => (
								<SelectItem key={key} value={key}>
									{m.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
			<div className="flex flex-col gap-4">
				{loading.current && <LoadingEmptyState />}

				{!loading.current && entries.current.length === 0 && (
					<EmptyState description="暂无排行数据" className="py-12" />
				)}

				{!loading.current && entries.current.length > 0 && (
					<>
						<div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-center gap-3">
							{first && (
								<div className="sm:order-2">
									<PodiumCard
										entry={first}
										rank={1}
										formattedValue={formatValue(first.value)}
										unit={metricInfo.unit}
									/>
								</div>
							)}
							{second && (
								<div className="sm:order-1">
									<PodiumCard
										entry={second}
										rank={2}
										formattedValue={formatValue(second.value)}
										unit={metricInfo.unit}
									/>
								</div>
							)}
							{third && (
								<div className="sm:order-3">
									<PodiumCard
										entry={third}
										rank={3}
										formattedValue={formatValue(third.value)}
										unit={metricInfo.unit}
									/>
								</div>
							)}
						</div>

						{rest.length > 0 && (
							<Card className="py-0">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-20 font-semibold">排名</TableHead>
											<TableHead className="font-semibold">玩家</TableHead>
											<TableHead className="font-semibold text-right">
												{metricInfo.label}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{rest.map((entry, i) => (
											<TableRow key={entry.uuid}>
												<TableCell>
													<span className="text-muted-foreground">
														#{i + 4}
													</span>
												</TableCell>
												<TableCell className="text-base">
													{entry.player_name}
												</TableCell>
												<TableCell align="right" className="text-base">
													<span className="font-bold">
														{formatValue(entry.value)}
													</span>
													<span className="text-muted-foreground text-sm ml-1">
														{metricInfo.unit}
													</span>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</Card>
						)}
					</>
				)}
			</div>
		</>
	);
}
