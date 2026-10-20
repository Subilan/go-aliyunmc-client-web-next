import type { GameStats } from '~/utils/requests/game';
import {
	formatDistanceCm,
	formatHearts,
	formatPlaytimeHours
} from '~/components/game-statistics/stat-section';
import { StatLeaderboardPopover } from '~/components/game-statistics/stat-leaderboard-popover';

interface BentoCardDef {
	key: string;
	label: string;
	format: 'distance' | 'time' | 'number' | 'hearts';
}

const BENTO_CARDS: BentoCardDef[] = [
	{ key: 'minecraft:walk_one_cm', label: '行走距离', format: 'distance' },
	{ key: 'minecraft:sprint_one_cm', label: '冲刺距离', format: 'distance' },
	{ key: 'minecraft:swim_one_cm', label: '游泳距离', format: 'distance' },
	{ key: 'minecraft:fly_one_cm', label: '飞行距离', format: 'distance' },
	{ key: 'minecraft:climb_one_cm', label: '攀爬距离', format: 'distance' },
	{ key: 'minecraft:crouch_one_cm', label: '潜行距离', format: 'distance' },
	{ key: 'minecraft:fall_one_cm', label: '坠落距离', format: 'distance' },
	{ key: 'minecraft:aviate_one_cm', label: '鞘翅飞行', format: 'distance' },
	{ key: 'minecraft:horse_one_cm', label: '骑马距离', format: 'distance' },
	{ key: 'minecraft:minecart_one_cm', label: '矿车距离', format: 'distance' },
	{ key: 'minecraft:boat_one_cm', label: '划船距离', format: 'distance' },

	{ key: 'minecraft:play_time', label: '游玩时间', format: 'time' },
	{ key: 'minecraft:sneak_time', label: '潜行时间', format: 'time' },
	{ key: 'minecraft:time_since_death', label: '距上次死亡', format: 'time' },
	{ key: 'minecraft:time_since_rest', label: '距上次休息', format: 'time' },

	{ key: 'minecraft:jump', label: '跳跃次数', format: 'number' },
	{ key: 'minecraft:deaths', label: '死亡次数', format: 'number' },
	{ key: 'minecraft:mob_kills', label: '生物击杀', format: 'number' },
	{ key: 'minecraft:player_kills', label: '玩家击杀', format: 'number' },
	{ key: 'minecraft:fish_caught', label: '钓鱼收获', format: 'number' },
	{ key: 'minecraft:animals_bred', label: '动物繁殖', format: 'number' },
	{ key: 'minecraft:sleep_in_bed', label: '睡觉次数', format: 'number' },
	{ key: 'minecraft:talk_to_villager', label: '与村民交谈', format: 'number' },
	{ key: 'minecraft:trade_with_villager', label: '与村民交易', format: 'number' },
	{ key: 'minecraft:eat_cake_slice', label: '蛋糕食用', format: 'number' },
	{ key: 'minecraft:clean_armor', label: '清洗护甲', format: 'number' },
	{ key: 'minecraft:bell_ring', label: '敲钟次数', format: 'number' },
	{ key: 'minecraft:raid_win', label: '袭击胜利', format: 'number' },
	{ key: 'minecraft:target_hit', label: '命中标靶', format: 'number' },

	{ key: 'minecraft:damage_dealt', label: '造成伤害', format: 'hearts' },
	{ key: 'minecraft:damage_taken', label: '承受伤害', format: 'hearts' },
	{ key: 'minecraft:damage_blocked_by_shield', label: '盾牌格挡', format: 'hearts' },

	{ key: 'minecraft:inspect_dispenser', label: '查看发射器', format: 'number' },
	{ key: 'minecraft:open_chest', label: '打开箱子', format: 'number' },
	{ key: 'minecraft:open_enderchest', label: '打开末影箱', format: 'number' },
	{ key: 'minecraft:open_shulker_box', label: '打开潜影盒', format: 'number' },
];

function formatValue(def: BentoCardDef, value: number): string {
	switch (def.format) {
		case 'distance':
			return formatDistanceCm(value);
		case 'time':
			return formatPlaytimeHours(value, true);
		case 'hearts':
			return formatHearts(value);
		default:
			return value.toLocaleString();
	}
}

function BentoCard({ def, value }: { def: BentoCardDef; value: number }) {
	return (
		<div className="hover:bg-neutral-50 transition-colors rounded-lg p-4 cursor-default">
			<div className="text-sm text-muted-foreground">{def.label}</div>
			<div className="text-2xl font-medium text-neutral-800 tabular-nums mt-1">
				{def.format === 'hearts' ? (
					<span className="flex items-center gap-1">
						{formatValue(def, value)}
						<span>×</span>
						<img
							src="/heart.png"
							alt=""
							className="w-5 h-5"
							style={{ imageRendering: 'pixelated' }}
						/>
					</span>
				) : (
					formatValue(def, value)
				)}
			</div>
		</div>
	);
}

export function MiscStatsBento(props: { stats: GameStats | null; playerUuid?: string }) {
	const custom = props.stats?.stats?.['minecraft:custom'] ?? {};
	const visibleCards = BENTO_CARDS.filter(def => custom[def.key] !== undefined);

	if (visibleCards.length === 0) return null;

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0">
			{visibleCards.map(def => (
				<StatLeaderboardPopover key={def.key} metric={def.key} label={def.label} format={def.format} playerUuid={props.playerUuid}>
					<div>
						<BentoCard def={def} value={custom[def.key]} />
					</div>
				</StatLeaderboardPopover>
			))}
		</div>
	);
}
