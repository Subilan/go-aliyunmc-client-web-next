import { Checkbox } from '~/components/ui/checkbox';
import { Button } from '~/components/ui/button';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from '~/components/ui/collapsible';
import { ChevronRightIcon, ChevronUpIcon } from 'lucide-react';
import type { GameStats } from '~/utils/requests/game';
import useStateNamed from '~/hooks/useStateNamed';
import { useMcTranslate } from '~/hooks/useMcTranslate';
import { Times } from '~/utils/times';

const TIME_STATS = new Set([
	'minecraft:time_since_rest',
	'minecraft:time_since_death',
	'minecraft:total_world_time',
	'minecraft:play_time',
	'minecraft:sneak_time'
]);

const DISTANCE_STATS = new Set([
	'minecraft:walk_on_water_one_cm',
	'minecraft:aviate_one_cm',
	'minecraft:horse_one_cm',
	'minecraft:minecart_one_cm',
	'minecraft:boat_one_cm',
	'minecraft:swim_one_cm',
	'minecraft:crouch_one_cm',
	'minecraft:climb_one_cm',
	'minecraft:walk_one_cm',
	'minecraft:walk_under_water_one_cm',
	'minecraft:sprint_one_cm',
	'minecraft:fall_one_cm',
	'minecraft:fly_one_cm'
]);

function formatDistanceCm(cm: number): string {
	if (cm < 100) return `${cm}cm`;
	const m = cm / 100;
	if (m < 1000) return `${Math.round(m)}m`;
	return `${(m / 1000).toFixed(1)}km`;
}

const DAMAGE_STATS = new Set([
	'minecraft:damage_dealt',
	'minecraft:damage_taken',
	'minecraft:damage_absorbed',
	'minecraft:damage_resisted',
	'minecraft:damage_dealt_absorbed',
	'minecraft:damage_dealt_resisted',
	'minecraft:damage_blocked_by_shield'
]);

const GAME_TIME_STATS = new Set([
	'minecraft:time_since_rest',
	'minecraft:time_since_death',
	'minecraft:total_world_time',
	'minecraft:play_time',
	'minecraft:sneak_time'
]);

function formatHearts(value: number): string {
	const hearts = value / 20;
	if (hearts % 1 === 0) return hearts.toString();
	return hearts.toFixed(1);
}

function formatPlaytimeHours(v: number, realTime: boolean): string {
	if (realTime) {
		const hours = v / 20 / 3600;
		return `${hours.toFixed(1)}h`;
	}
	return Times.formatDuration(v);
}

function transformStat(k: string, v: number, realTime: boolean): string | number {
	if (TIME_STATS.has(k)) return formatPlaytimeHours(v, realTime);
	if (DISTANCE_STATS.has(k)) return formatDistanceCm(v);
	return v;
}

const STAT_EXCERPT = 6;

function StatValue({
	k,
	v,
	translate,
	realTime
}: {
	k: string;
	v: number;
	translate: (key: string) => string;
	realTime: boolean;
}) {
	return (
		<div className="flex">
			<div data-key-name={k} className="text-muted-foreground">
				{translate(k)}
			</div>
			<div className="flex-1" />
			{DAMAGE_STATS.has(k) ? (
				<div className="flex items-center gap-0.5">
					<span>{formatHearts(v)}</span>
					<span>×</span>
					<img
						src="/heart.png"
						alt=""
						className="w-4 h-4"
						style={{ imageRendering: 'pixelated' }}
					/>
				</div>
			) : (
				<div>
					{transformStat(k, v, realTime)}{' '}
					{GAME_TIME_STATS.has(k) && !realTime && (
						<span className="text-muted-foreground">(Minecraft)</span>
					)}
				</div>
			)}
		</div>
	);
}

export function StatSection(props: {
	stats: GameStats | null;
	name: string;
	label: string;
	description?: string;
	denseOnMobile?: boolean;
	showRealTimeToggle?: boolean;
}) {
	const translate = useMcTranslate();
	const expanded = useStateNamed(false);
	const realTime = useStateNamed(false);

	const items =
		props.stats?.stats && props.stats.stats[props.name]
			? Object.entries(props.stats.stats[props.name])
			: [];
	items.sort((a, b) => a[0].localeCompare(b[0]));
	const hasMore = items.length > STAT_EXCERPT;
	const excerpt = items.slice(0, STAT_EXCERPT);
	const remainder = items.slice(STAT_EXCERPT);

	const colsClass = props.denseOnMobile
		? 'grid-cols-1 md:grid-cols-3'
		: 'grid-cols-2 md:grid-cols-3';

	return (
		<div>
			<div className="flex flex-col gap-2 mb-3">
				<div className="mb-1">
					<h3 className="text-lg font-bold mb-1">
						{props.label} ({items.length} 项)
					</h3>
					{props.description && <p className="text-muted-foreground">{props.description}</p>}
					{props.showRealTimeToggle && (
						<div className="flex items-center gap-2 mt-1">
							<Checkbox
								id="realtime-toggle"
								checked={realTime.current}
								onCheckedChange={checked => realTime.set(!!checked)}
							/>
							<label
								htmlFor="realtime-toggle"
								className="text-sm cursor-pointer select-none"
							>
								显示现实时间
							</label>
						</div>
					)}
				</div>
				<div className={`grid gap-3 ${colsClass}`}>
					{excerpt.length > 0 ? (
						excerpt.map(([k, v]) => (
							<StatValue key={k} k={k} v={v} translate={translate} realTime={realTime.current} />
						))
					) : (
						<span>暂无数据</span>
					)}
				</div>
			</div>
			<Collapsible open={expanded.current} onOpenChange={v => expanded.set(v)}>
				<CollapsibleContent>
					<div className={`grid gap-3 ${colsClass}`}>
						{remainder.map(([k, v]) => (
							<StatValue key={k} k={k} v={v} translate={translate} realTime={realTime.current} />
						))}
					</div>
				</CollapsibleContent>
				{hasMore && (
					<CollapsibleTrigger asChild>
						<div className="flex items-center gap-1 cursor-pointer select-none text-sm text-muted-foreground">
							<Button variant="ghost" size="icon-xs" asChild>
								<span>
									{expanded.current ? (
										<ChevronUpIcon data-icon="inline-start" />
									) : (
										<ChevronRightIcon data-icon="inline-start" />
									)}
								</span>
							</Button>
							{expanded.current ? '收起' : `展开剩余 ${remainder.length} 项`}
						</div>
					</CollapsibleTrigger>
				)}
			</Collapsible>
		</div>
	);
}
