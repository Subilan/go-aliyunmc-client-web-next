import type { Route } from './+types/game-statistics';
import { Card, CardContent, Collapse, IconButton } from '@mui/material';
import { AlertTriangleIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import PageHeader from '~/components/page-header';
import { PAGE_NAME_GAME_STATISTICS } from '~/consts/page-names';
import { getGameStats, getSortedAdvancements } from '~/utils/requests/game';
import useStateNamed from '~/hooks/useStateNamed';
import { Times } from '~/utils/times';
import { CardLabel } from '~/components/card-label';
import { MetricItem } from '~/components/metric-item';
import { SkinModel } from '~/components/game-statistics/skin-model';
import { AdvancementItem } from '~/components/game-statistics/advancement-item';
import { AdvancementMetrics } from '~/components/game-statistics/advancement-metrics';
import { StatSection } from '~/components/game-statistics/stat-section';
import { OnlineStatusSection } from '~/components/game-statistics/online-status-section';
import EmptyState from '~/components/empty-state';
import { createLoader } from '~/utils/createLoader';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: PAGE_NAME_GAME_STATISTICS + ' - Seatide' },
		{ name: 'description', content: '查看玩家在游戏中的各种进度信息。' }
	];
}

export const gameStatisticsLoader = createLoader(async args => {
	const uuid = args.params.uuid!;

	const [advRes, statsRes] = await Promise.all([getSortedAdvancements(uuid), getGameStats(uuid)]);

	if (advRes.error === null && statsRes.error === null) {
		return { uuid, error: null, advancements: advRes.data, gameStats: statsRes.data };
	}

	const result = {
		uuid: null,
		error: '获取数据过程中出现问题',
		advancements: null,
		gameStats: null
	};

	if (advRes.status === 404 || statsRes.status === 404) {
		result.error = '暂无此玩家数据';
	}

	if (advRes.status === 403 || statsRes.status === 403) {
		result.error = '你没有查看此玩家数据的权限';
	}

	return result;
});

function Info() {
	return (
		<>
			<p>
				游戏统计页面的数据来自 Minecraft
				自带的统计功能，此页面对其中的数据进行了组织和整理，最终以便于查看的形式展示。在游戏中，你可以在暂停屏幕中找到进入统计信息界面的入口。
			</p>
			<h4>数据时效</h4>
			<p>此页面的数据只会在服务器开启的状态下进行同步，同步时间间隔为 5 分钟。</p>
			<h4>私密数据</h4>
			<p>
				默认情况下，你的统计页面也可以被其他获得了白名单的玩家访问。如果你不希望除了你以外的任何人访问，请前往个人资料中将此页面设置为不公开。
			</p>
		</>
	);
}

export default function GameStatistics() {
	const loaderData = gameStatisticsLoader.get();
	const effectiveUuid = loaderData.uuid;

	if (loaderData.advancements === null) {
		return (
			<>
				<PageHeader>{PAGE_NAME_GAME_STATISTICS}</PageHeader>
				<EmptyState
					className="h-64"
					iconComponent={<AlertTriangleIcon size={20} />}
					description={loaderData.error}
				/>
			</>
		);
	}

	const { advancements, gameStats } = loaderData;
	const showUncompleted = useStateNamed(false);

	const completed = advancements.filter(a => a.done);
	const uncompleted = advancements.filter(a => !a.done);

	const advProgress = gameStats?.advancement_progress;

	function getStat(category: string, stat: string): number {
		return gameStats?.stats?.[`minecraft:${category}`]?.[`minecraft:${stat}`] ?? 0;
	}

	return (
		<>
			<PageHeader info={Info()}>{PAGE_NAME_GAME_STATISTICS}</PageHeader>
			<div className="flex flex-col gap-3">
				{/* Player Overview */}
				<Card variant="outlined" sx={{ overflow: 'visible' }}>
					<CardContent>
						<CardLabel>玩家概览</CardLabel>
						<div className="flex flex-col-reverse items-center md:flex-row gap-6">
							<SkinModel uuid={effectiveUuid!} />
							<div className="flex-1 flex w-full md:w-auto flex-col gap-3">
								{gameStats ? (
									<>
										<div className="text-2xl border-b border-b-neutral-200">
											{gameStats.player_name}
										</div>
										{/* Playtime metrics */}
										<div className="grid grid-cols-3 gap-3">
											<MetricItem title="游玩时长">
												{gameStats.playtime > 0
													? `${(gameStats.playtime / 20 / 3600).toFixed(1)}h`
													: '—'}
											</MetricItem>
											<MetricItem title="最长连续登录">
												{gameStats.join_streak} 天
											</MetricItem>
											<MetricItem title="最近在线">
												{gameStats.last_seen
													? Times.formatFromNow(gameStats.last_seen)
													: '—'}
											</MetricItem>
											<MetricItem title="成就进度">
												{advProgress?.completed}/{advProgress?.total}
											</MetricItem>
											<MetricItem title="跑图">
												{(getStat('custom', 'walk_one_cm') / 100).toFixed(
													0
												)}{' '}
												格
											</MetricItem>
										</div>
										<OnlineStatusSection onlineDates={gameStats.online_dates} />
									</>
								) : (
									<div className="text-neutral-400 text-sm">暂无统计数据</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Advancements */}
				<Card variant="outlined" sx={{ overflow: 'visible' }}>
					<CardContent>
						<CardLabel>成就</CardLabel>
						{advancements.length === 0 ? (
							<div className="text-neutral-400 text-sm">暂无成就数据</div>
						) : (
							<>
								<AdvancementMetrics advProgress={advProgress} />

								<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 overflow-visible">
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
											<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-3 overflow-visible">
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
						<CardLabel>统计数据</CardLabel>
						<div className="flex flex-col gap-5">
							<StatSection
								label="使用或放置"
								description="使用的物品或者放置方块的次数。"
								stats={gameStats}
								name="minecraft:used"
							/>
							<hr />
							<StatSection
								label="拾取"
								description="从地上捡起的物品个数。"
								stats={gameStats}
								name="minecraft:picked_up"
							/>
							<hr />
							<StatSection
								label="挖掘"
								description="挖掘的方块个数。"
								stats={gameStats}
								name="minecraft:mined"
							/>
							<hr />
							<StatSection
								label="击杀"
								description="击杀的生物个数。"
								stats={gameStats}
								name="minecraft:killed"
							/>
							<hr />
							<StatSection
								label="死于"
								description="被这些生物击杀的次数。"
								stats={gameStats}
								name="minecraft:killed_by"
							/>
							<hr />
							<StatSection
								label="制造"
								description="制造的物品个数。"
								stats={gameStats}
								name="minecraft:crafted"
							/>
							<hr />
							<StatSection
								label="损坏"
								description="损坏的工具个数。"
								stats={gameStats}
								name="minecraft:broken"
							/>
							<hr />
							<StatSection
								denseOnMobile
								showRealTimeToggle
								label="杂项"
								description="一些其它的统计信息。"
								stats={gameStats}
								name="minecraft:custom"
							/>
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
