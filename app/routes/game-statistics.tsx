import { useContext, useEffect, useRef } from 'react';
import type { Route } from './+types/game-statistics';
import { Card, CardContent, Collapse, IconButton, LinearProgress } from '@mui/material';
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon } from 'lucide-react';
import { SkinViewer } from 'skinview3d';
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
import { useMcTranslate } from '~/hooks/useMcTranslate';
import { Times } from '~/utils/times';
import { CardLabel } from '~/components/card-label';
import { MetricItem } from '~/components/metric-item';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: PAGE_NAME_GAME_STATISTICS + ' - Seatide' },
		{ name: 'description', content: '查看玩家在游戏中的各种进度信息。' }
	];
}

function SkinModel(props: { uuid: string }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvasRef.current) return;
		const viewer = new SkinViewer({
			canvas: canvasRef.current,
			width: 180,
			height: 200,
			skin: `https://minotar.net/skin/${props.uuid}`
		});
		viewer.autoRotate = true;
		return () => viewer.dispose();
	}, []);

	return <canvas ref={canvasRef} className="rounded-lg" />;
}

const gifAdvancements = new Set([
	'minecraft:adventure/avoid_vibration',
	'minecraft:end/respawn_dragon',
	'minecraft:nether/summon_wither',
	'minecraft:story/enchant_item'
]);

function advancementIconPath(resourceLocation: string): string {
	const ext = gifAdvancements.has(resourceLocation) ? 'gif' : 'png';
	const name = resourceLocation.replace('minecraft:', '').replace('/', '~');
	return `/advancement_icons/${name}.${ext}`;
}

const CATEGORY_DISPLAY: Record<string, string> = {
	'minecraft:story': '主线',
	'minecraft:husbandry': '农牧',
	'minecraft:adventure': '冒险',
	'minecraft:nether': '下界',
	'minecraft:end': '末地'
};

function AdvancementMetrics({
	advProgress
}: {
	advProgress: import('~/utils/requests/game').AdvancementProgress | undefined;
}) {
	if (!advProgress || advProgress.categories.length === 0) {
		return <div className="text-neutral-400 text-sm">加载中...</div>;
	}

	return (
		<div className="mb-4">
			<div className="grid grid-cols-5 gap-3">
				{advProgress.categories.map(c => (
					<MetricItem
						centered
						key={c.category}
						title={CATEGORY_DISPLAY[c.category] ?? c.category}
					>
						{c.completed}/{c.total}
					</MetricItem>
				))}
			</div>
		</div>
	);
}

function AdvancementItem({ a, completed }: { a: AdvancementEntry; completed: boolean }) {
	const grayscaleClass = completed ? '' : 'grayscale';
	const hasProgress = Object.keys(a.criteria).length > 0;
	const translate = useMcTranslate();

	let background = '/advancement_icons/advbg-progress';
	if (a.isChallenge) background = '/advancement_icons/advbg-challenge';
	if (a.isGoal) background = '/advancement_icons/advbg-goal';
	if (completed) background += '-completed';
	background += '.png';

	return (
		<div className={`group/item relative cursor-default p-2 hover:z-20 flex justify-center`}>
			{/* Tooltip panel */}
			<div
				className="absolute top-[15px] left-[23%] z-10
				opacity-0 scale-95 group-hover/item:opacity-100 group-hover/item:scale-100
				transition-all duration-200 ease-out
				origin-top-left
				pointer-events-none group-hover/item:pointer-events-auto"
			>
				<div className="bg-black text-white rounded-lg shadow-lg shadow-neutral-600 border-2 border-neutral-300 min-w-[180px] overflow-hidden">
					{/* Title row — red bg, full width, icon height */}
					<div
						className="flex items-center h-[30px]"
						style={{
							backgroundColor: completed ? 'rgb(170, 126, 16)' : 'rgb(198,198,198)'
						}}
					>
						<div className="w-[48px] shrink-0" />
						<span className="font-bold whitespace-nowrap pr-3 pl-2 text-shadow-black text-shadow-2xs">
							{a.chineseName}
						</span>
					</div>
					{/* Description — flush to left edge */}
					<div className="px-3 pt-3 pb-2 text-sm text-neutral-300 leading-relaxed">
						{a.chineseDescription}
					</div>
					{/* Criteria progress */}
					{hasProgress && (
						<div className="px-3 pb-2 text-xs text-neutral-400 border-t border-neutral-700 pt-2 space-y-0.5">
							<div className="text-neutral-300 mb-2">
								{completed ? '已完成的条件' : '进度'}
							</div>
							{Object.entries(a.criteria).map(([key, time]) => (
								<div key={key} className="truncate" title={time}>
									{translate(key)} — {Times.formatFromNow(time)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Icon with background frame */}
			<div className="relative z-10 w-[48px] h-[48px] flex items-center justify-center shrink-0">
				<img
					src={background}
					draggable={false}
					alt=""
					className="absolute inset-0 w-full h-full"
				/>
				<img
					draggable={false}
					src={advancementIconPath(a.resourceLocation)}
					alt={a.chineseName}
					className={`w-[30px] h-[30px] relative z-10 ${grayscaleClass}`}
					loading="lazy"
					style={{ imageRendering: 'pixelated' }}
				/>
				{/* Blue dot: uncompleted but has progress */}
				{!completed && hasProgress && (
					<div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full z-20" />
				)}
			</div>
		</div>
	);
}

const TIME_STATS = new Set([
	'minecraft:time_since_rest',
	'minecraft:time_since_death',
	'minecraft:total_world_time',
	'minecraft:play_time',
	'minecraft:sneak_time'
]);

const DISTANCE_STATS = new Set([
	'minecraft:boat_one_cm',
	'minecraft:swim_one_cm',
	'minecraft:crouch_one_cm',
	'minecraft:climb_one_cm',
	'minecraft:walk_one_cm',
	'minecraft:walk_under_water_one_cm',
	'minecraft:sprint_one_cm',
	'minecraft:fall_one_cm',
	'minecraft:fly_one_cm',
	'minecraft:walk_on_water_one_cm'
]);

function formatDistanceCm(cm: number): string {
	if (cm < 100) return `${cm}cm`;
	const m = cm / 100;
	if (m < 1000) return `${Math.round(m)}m`;
	return `${(m / 1000).toFixed(1)}km`;
}

function transformStat(k: string, v: number): string | number {
	if (TIME_STATS.has(k)) return Times.formatDuration(v);
	if (DISTANCE_STATS.has(k)) return formatDistanceCm(v);
	return v;
}

const STAT_EXCERPT = 6;

function StatSection(props: { stats: GameStats | null; name: string; label: string }) {
	const translate = useMcTranslate();
	const expanded = useStateNamed(false);

	const items =
		props.stats?.stats && props.stats.stats[props.name]
			? Object.entries(props.stats.stats[props.name])
			: [];
	const hasMore = items.length > STAT_EXCERPT;
	const excerpt = items.slice(0, STAT_EXCERPT);
	const remainder = items.slice(STAT_EXCERPT);

	return (
		<div>
			<div className="flex flex-col gap-2 mb-3">
				<div className="mb-1">
					{props.label} ({items.length})
				</div>
				<div className="grid grid-cols-3 gap-3">
					{excerpt.length > 0 ? (
						excerpt.map(([k, v]) => (
							<div key={k} className="flex">
								<div className="text-neutral-500">{translate(k)}</div>
								<div className="flex-1" />
								<div>{transformStat(k, v)}</div>
							</div>
						))
					) : (
						<span>暂无数据</span>
					)}
				</div>
			</div>
			<Collapse in={expanded.current}>
				<div className="grid grid-cols-3 gap-3">
					{remainder.map(([k, v]) => (
						<div key={k} className="flex">
							<div className="text-neutral-500">{translate(k)}</div>
							<div className="flex-1" />
							<div>{transformStat(k, v)}</div>
						</div>
					))}
				</div>
			</Collapse>
			{hasMore && (
				<div
					className="flex items-center gap-1 cursor-pointer select-none text-sm text-neutral-500"
					onClick={() => expanded.set(!expanded.current)}
				>
					<IconButton size="small">
						{expanded.current ? (
							<ChevronUpIcon size={16} />
						) : (
							<ChevronRightIcon size={16} />
						)}
					</IconButton>
					{expanded.current ? '收起' : `展开剩余 ${remainder.length} 项`}
				</div>
			)}
		</div>
	);
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
										<div className="text-2xl">{stats.player_name}</div>
										<hr />
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
							<StatSection label="使用或放置" stats={stats} name="minecraft:used" />
							<hr />
							<StatSection label="拾取" stats={stats} name="minecraft:picked_up" />
							<hr />
							<StatSection label="挖掘" stats={stats} name="minecraft:mined" />
							<hr />
							<StatSection label="击杀" stats={stats} name="minecraft:killed" />
							<hr />
							<StatSection label="死于" stats={stats} name="minecraft:killed_by" />
							<hr />
							<StatSection label="制造" stats={stats} name="minecraft:crafted" />
							<hr />
							<StatSection label="损坏" stats={stats} name="minecraft:broken" />
							<hr />
							<StatSection label="杂项" stats={stats} name="minecraft:custom" />
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
