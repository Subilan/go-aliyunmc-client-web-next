import { useContext, useEffect } from 'react';
import type { Route } from './+types/game-statistics';
import { Card, CardContent, Collapse, IconButton } from '@mui/material';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import PageHeader from '~/components/page-header';
import { PAGE_NAME_GAME_STATISTICS } from '~/consts/page-names';
import {
	getAdvancements,
	getGameStats,
	type AdvancementEntry,
	type GameStats
} from '~/utils/requests/game';
import useStateNamed from '~/hooks/useStateNamed';
import { UserContext } from '~/contexts/user';
import { Times } from '~/utils/times';
import { CardLabel } from '~/components/card-label';
import { MetricItem } from '~/components/metric-item';
import { SkinModel } from '~/components/game-statistics/skin-model';
import { AdvancementItem } from '~/components/game-statistics/advancement-item';
import { AdvancementMetrics } from '~/components/game-statistics/advancement-metrics';
import { StatSection } from '~/components/game-statistics/stat-section';
import { OnlineStatusSection } from '~/components/game-statistics/online-status-section';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: PAGE_NAME_GAME_STATISTICS + ' - Seatide' },
		{ name: 'description', content: '查看玩家在游戏中的各种进度信息。' }
	];
}

export default function GameStatistics() {
	const user = useContext(UserContext);
	const advancements = useStateNamed<AdvancementEntry[]>([]);
	const gameStats = useStateNamed<GameStats | null>(null);
	const showUncompleted = useStateNamed(false);

	useEffect(() => {
		getAdvancements().then(res => {
			if (res.error === null) advancements.set(res.data!);
		});
		getGameStats().then(res => {
			if (res.error === null) gameStats.set(res.data!);
		});
	}, []);

	const completed = advancements.current.filter(a => a.done);
	const uncompleted = advancements.current.filter(a => !a.done);

	const stats = gameStats.current;
	const playtime = stats?.playtime;
	const advProgress = stats?.advancement_progress;

	function getStat(category: string, stat: string): number {
		return stats?.stats?.[`minecraft:${category}`]?.[`minecraft:${stat}`] ?? 0;
	}

	return (
		<>
			<PageHeader>{PAGE_NAME_GAME_STATISTICS}</PageHeader>
			<div className="flex flex-col gap-3">
				{/* Player Overview */}
				<Card variant="outlined">
					<CardContent>
						<CardLabel>玩家概览 / PLAYER OVERVIEW</CardLabel>
						<div className="flex gap-6">
							<SkinModel uuid={user?.whitelist_uuid!} />
							<div className="flex-1 flex flex-col gap-3">
								{stats === null ? (
									<div className="text-neutral-400 text-sm">加载中...</div>
								) : (
									<>
										<div className="text-2xl border-b border-b-neutral-200">{stats.player_name}</div>
										{/* Playtime metrics */}
										{playtime && (
											<div className="grid grid-cols-3 gap-3">
												<MetricItem title="游玩时长">
													{Times.formatDuration(playtime.playtime)}
												</MetricItem>
												<MetricItem title="连续登录">
													{playtime.join_streak} 天
												</MetricItem>
												<MetricItem title="最近在线">
													{playtime.last_seen
														? Times.formatFromNow(playtime.last_seen)
														: '—'}
												</MetricItem>
												<MetricItem title="成就进度">
													{advProgress?.completed}/{advProgress?.total}
												</MetricItem>
												<MetricItem title="跑图">
													{(
														getStat('custom', 'walk_one_cm') / 100
													).toFixed(0)}{' '}
													格
												</MetricItem>
											</div>
										)}
										<OnlineStatusSection onlineDates={stats.online_dates} />
									</>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Advancements */}
				<Card variant="outlined" sx={{ overflow: 'visible' }}>
					<CardContent>
						<CardLabel>成就 / ADVANCEMENTS</CardLabel>
						{advancements.current.length === 0 ? (
							<div className="text-neutral-400 text-sm">加载中...</div>
						) : (
							<>
								<AdvancementMetrics advProgress={advProgress} />

								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 overflow-visible">
									{completed.map(a => (
										<AdvancementItem key={a.resourceLocation} a={a} completed />
									))}
								</div>

								{uncompleted.length > 0 && (
									<div className="mt-4">
										<div
											className="flex items-center gap-1 cursor-pointer select-none text-sm text-neutral-500"
											onClick={() =>
												showUncompleted.set(!showUncompleted.current)
											}
										>
											<IconButton size="small">
												{showUncompleted.current ? (
													<ChevronDownIcon size={16} />
												) : (
													<ChevronRightIcon size={16} />
												)}
											</IconButton>
											未完成 ({uncompleted.length})
										</div>
										<Collapse in={showUncompleted.current}>
											<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-3 overflow-visible">
												{uncompleted.map(a => (
													<AdvancementItem
														key={a.resourceLocation}
														a={a}
														completed={false}
													/>
												))}
											</div>
										</Collapse>
									</div>
								)}
							</>
						)}
					</CardContent>
				</Card>
				<Card variant="outlined">
					<CardContent>
						<CardLabel>统计数据 / STATISTICS</CardLabel>
						<div className="flex flex-col gap-5">
							<StatSection
								label="使用或放置"
								description="使用的物品或者放置方块的次数。"
								stats={stats}
								name="minecraft:used"
							/>
							<hr />
							<StatSection
								label="拾取"
								description="从地上捡起的物品个数。"
								stats={stats}
								name="minecraft:picked_up"
							/>
							<hr />
							<StatSection
								label="挖掘"
								description="挖掘的方块个数。"
								stats={stats}
								name="minecraft:mined"
							/>
							<hr />
							<StatSection
								label="击杀"
								description="击杀的生物个数。"
								stats={stats}
								name="minecraft:killed"
							/>
							<hr />
							<StatSection
								label="死于"
								description="被这些生物击杀的次数。"
								stats={stats}
								name="minecraft:killed_by"
							/>
							<hr />
							<StatSection
								label="制造"
								description="制造的物品个数。"
								stats={stats}
								name="minecraft:crafted"
							/>
							<hr />
							<StatSection
								label="损坏"
								description="损坏的工具个数。"
								stats={stats}
								name="minecraft:broken"
							/>
							<hr />
							<StatSection
								label="杂项"
								description="一些其它的统计信息。"
								stats={stats}
								name="minecraft:custom"
							/>
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
