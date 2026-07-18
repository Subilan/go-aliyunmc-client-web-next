import { useContext, useCallback } from "react";
import { McTranslationContext } from "~/contexts/mctranslations";
import type { GameStats } from "~/utils/requests/game";
import {
  formatDistanceCm,
  formatHearts,
  formatPlaytimeHours,
} from "~/components/game-statistics/stat-section";
import { SearchIcon } from "lucide-react";

const TIME_STATS = new Set([
  "minecraft:time_since_rest",
  "minecraft:time_since_death",
  "minecraft:total_world_time",
  "minecraft:play_time",
  "minecraft:sneak_time",
]);

const DISTANCE_STATS = new Set([
  "minecraft:walk_on_water_one_cm",
  "minecraft:aviate_one_cm",
  "minecraft:horse_one_cm",
  "minecraft:minecart_one_cm",
  "minecraft:boat_one_cm",
  "minecraft:swim_one_cm",
  "minecraft:crouch_one_cm",
  "minecraft:climb_one_cm",
  "minecraft:walk_one_cm",
  "minecraft:walk_under_water_one_cm",
  "minecraft:sprint_one_cm",
  "minecraft:fall_one_cm",
  "minecraft:fly_one_cm",
]);

const DAMAGE_STATS = new Set([
  "minecraft:damage_dealt",
  "minecraft:damage_taken",
  "minecraft:damage_absorbed",
  "minecraft:damage_resisted",
  "minecraft:damage_dealt_absorbed",
  "minecraft:damage_dealt_resisted",
  "minecraft:damage_blocked_by_shield",
]);

const GAME_TIME_STATS = new Set([
  "minecraft:time_since_rest",
  "minecraft:time_since_death",
  "minecraft:total_world_time",
  "minecraft:play_time",
  "minecraft:sneak_time",
]);

interface BentoCardDef {
  key: string;
  label: string;
  format: "distance" | "time" | "number" | "hearts";
  icon: string;
}

const BENTO_CARDS: BentoCardDef[] = [
  {
    key: "minecraft:walk_one_cm",
    label: "行走距离",
    format: "distance",
    icon: "🚶",
  },
  {
    key: "minecraft:sprint_one_cm",
    label: "冲刺距离",
    format: "distance",
    icon: "🏃",
  },
  {
    key: "minecraft:swim_one_cm",
    label: "游泳距离",
    format: "distance",
    icon: "🏊",
  },
  {
    key: "minecraft:fly_one_cm",
    label: "飞行距离",
    format: "distance",
    icon: "🕊️",
  },
  {
    key: "minecraft:climb_one_cm",
    label: "攀爬距离",
    format: "distance",
    icon: "🧗",
  },
  {
    key: "minecraft:crouch_one_cm",
    label: "潜行距离",
    format: "distance",
    icon: "🥷",
  },
  {
    key: "minecraft:fall_one_cm",
    label: "坠落距离",
    format: "distance",
    icon: "🪂",
  },
  {
    key: "minecraft:aviate_one_cm",
    label: "鞘翅飞行",
    format: "distance",
    icon: "🪶",
  },
  {
    key: "minecraft:horse_one_cm",
    label: "骑马距离",
    format: "distance",
    icon: "🐴",
  },
  {
    key: "minecraft:minecart_one_cm",
    label: "矿车距离",
    format: "distance",
    icon: "🛒",
  },
  {
    key: "minecraft:boat_one_cm",
    label: "划船距离",
    format: "distance",
    icon: "🚣",
  },

  { key: "minecraft:play_time", label: "游玩时间", format: "time", icon: "⏱️" },
  {
    key: "minecraft:sneak_time",
    label: "潜行时间",
    format: "time",
    icon: "🤫",
  },
  {
    key: "minecraft:time_since_death",
    label: "距上次死亡",
    format: "time",
    icon: "💀",
  },
  {
    key: "minecraft:time_since_rest",
    label: "距上次休息",
    format: "time",
    icon: "🛌",
  },

  { key: "minecraft:jump", label: "跳跃次数", format: "number", icon: "⬆️" },
  { key: "minecraft:deaths", label: "死亡次数", format: "number", icon: "💀" },
  {
    key: "minecraft:mob_kills",
    label: "生物击杀",
    format: "number",
    icon: "⚔️",
  },
  {
    key: "minecraft:player_kills",
    label: "玩家击杀",
    format: "number",
    icon: "🗡️",
  },
  {
    key: "minecraft:fish_caught",
    label: "钓鱼收获",
    format: "number",
    icon: "🎣",
  },
  {
    key: "minecraft:animals_bred",
    label: "动物繁殖",
    format: "number",
    icon: "🐣",
  },
  {
    key: "minecraft:sleep_in_bed",
    label: "睡觉次数",
    format: "number",
    icon: "🛏️",
  },
  {
    key: "minecraft:talk_to_villager",
    label: "与村民交谈",
    format: "number",
    icon: "💬",
  },
  {
    key: "minecraft:trade_with_villager",
    label: "与村民交易",
    format: "number",
    icon: "🪙",
  },
  {
    key: "minecraft:eat_cake_slice",
    label: "蛋糕食用",
    format: "number",
    icon: "🍰",
  },
  {
    key: "minecraft:clean_armor",
    label: "清洗护甲",
    format: "number",
    icon: "🛡️",
  },
  {
    key: "minecraft:bell_ring",
    label: "敲钟次数",
    format: "number",
    icon: "🔔",
  },
  {
    key: "minecraft:raid_win",
    label: "袭击胜利",
    format: "number",
    icon: "🏆",
  },
  {
    key: "minecraft:target_hit",
    label: "命中标靶",
    format: "number",
    icon: "🎯",
  },

  {
    key: "minecraft:damage_dealt",
    label: "造成伤害",
    format: "hearts",
    icon: "💥",
  },
  {
    key: "minecraft:damage_taken",
    label: "承受伤害",
    format: "hearts",
    icon: "🩹",
  },
  {
    key: "minecraft:damage_blocked_by_shield",
    label: "盾牌格挡",
    format: "hearts",
    icon: "🛡️",
  },

  {
    key: "minecraft:inspect_dispenser",
    label: "查看发射器",
    format: "number",
    icon: "📦",
  },
  {
    key: "minecraft:open_chest",
    label: "打开箱子",
    format: "number",
    icon: "📦",
  },
  {
    key: "minecraft:open_enderchest",
    label: "打开末影箱",
    format: "number",
    icon: "📦",
  },
  {
    key: "minecraft:open_shulker_box",
    label: "打开潜影盒",
    format: "number",
    icon: "📦",
  },
];

const STAT_CATEGORIES = [
  { name: "minecraft:used", label: "使用或放置" },
  { name: "minecraft:picked_up", label: "拾取" },
  { name: "minecraft:mined", label: "挖掘" },
  { name: "minecraft:killed", label: "击杀" },
  { name: "minecraft:killed_by", label: "死于" },
  { name: "minecraft:crafted", label: "制造" },
  { name: "minecraft:broken", label: "损坏" },
] as const;

function formatBentoValue(def: BentoCardDef, value: number): string {
  switch (def.format) {
    case "distance":
      return formatDistanceCm(value);
    case "time":
      return formatPlaytimeHours(value, true);
    case "hearts":
      return formatHearts(value);
    default:
      return value.toLocaleString();
  }
}

function transformStat(k: string, v: number): string | number {
  if (TIME_STATS.has(k)) return formatPlaytimeHours(v, true);
  if (DISTANCE_STATS.has(k)) return formatDistanceCm(v);
  return v;
}

export function SearchResults(props: {
  gameStats: GameStats | null;
  searchQuery: string;
}) {
  const translation = useContext(McTranslationContext);

  const translateKey = useCallback(
    (key: string) => {
      if (!key.startsWith("minecraft:")) key = "minecraft:" + key;
      if (translation?.biomes[key]) {
        return (
          translation.biomes[key].chineseName ||
          translation.biomes[key].englishName
        );
      }
      if (translation?.entities[key]) {
        return (
          translation.entities[key].chineseName ||
          translation.entities[key].englishName
        );
      }
      if (translation?.blocksAndItems[key]) {
        return (
          translation.blocksAndItems[key].chineseName ||
          translation.blocksAndItems[key].englishName
        );
      }
      if (translation?.stats[key]) {
        return (
          translation.stats[key].chineseName ||
          translation.stats[key].englishName
        );
      }
      return key;
    },
    [translation],
  );

  const q = props.searchQuery.trim().toLowerCase();
  if (!q) return null;

  const stats = props.gameStats?.stats ?? {};
  const custom = stats["minecraft:custom"] ?? {};

  function matchesQuery(key: string, label?: string): boolean {
    const translated = translateKey(key);
    if (translated.toLowerCase().includes(q)) return true;
    if (label?.toLowerCase().includes(q)) return true;
    const en = key.replace(/^minecraft:/, "");
    if (en.toLowerCase().includes(q)) return true;
    return false;
  }

  // Collect matched grouped stat items
  type MatchEntry = { key: string; value: number; category: string };
  const groupedMatches: { category: string; items: MatchEntry[] }[] = [];

  for (const cat of STAT_CATEGORIES) {
    const catStats = stats[cat.name] ?? {};
    const items: MatchEntry[] = [];
    for (const [k, v] of Object.entries(catStats)) {
      if (matchesQuery(k)) {
        items.push({ key: k, value: v, category: cat.label });
      }
    }
    items.sort((a, b) =>
      translateKey(a.key).localeCompare(translateKey(b.key)),
    );
    if (items.length > 0) {
      groupedMatches.push({ category: cat.label, items });
    }
  }

  // Collect matched bento cards
  const matchedBento = BENTO_CARDS.filter((def) => {
    if (custom[def.key] === undefined) return false;
    return matchesQuery(def.key, def.label);
  });

  const totalMatches =
    groupedMatches.reduce((sum, g) => sum + g.items.length, 0) +
    matchedBento.length;

  return (
    <>
      {totalMatches === 0 ? (
        <div className="text-muted-foreground text-sm py-8 text-center">
          未找到匹配的统计项
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groupedMatches.map((group) => (
            <div key={group.category}>
              <h3 className="text-base font-bold mb-3">
                {group.category}
                <span className="text-muted-foreground font-normal text-sm ml-1">
                  ({group.items.length} 项)
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {group.items.map((item) => (
                  <div key={item.key} className="flex">
                    <div className="text-muted-foreground">
                      {translateKey(item.key)}
                    </div>
                    <div className="flex-1" />
                    {DAMAGE_STATS.has(item.key) ? (
                      <div className="flex items-center gap-0.5">
                        <span>{formatHearts(item.value)}</span>
                        <span>×</span>
                        <img
                          src="/heart.png"
                          alt=""
                          className="w-5 h-5"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                    ) : (
                      <div>
                        {transformStat(item.key, item.value)}{" "}
                        {GAME_TIME_STATS.has(item.key) && (
                          <span className="text-muted-foreground">
                            (Minecraft)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {matchedBento.length > 0 && (
            <>
              {groupedMatches.length > 0 && <hr />}
              <div>
                <h3 className="text-base font-bold mb-3">
                  游戏统计
                  <span className="text-muted-foreground font-normal text-sm ml-1">
                    ({matchedBento.length} 项)
                  </span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {matchedBento.map((def) => (
                    <div
                      key={def.key}
                      className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 flex flex-col gap-1"
                    >
                      <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <span className="text-base">{def.icon}</span>
                        {translateKey(def.key)}
                      </div>
                      <div className="text-2xl font-bold text-neutral-800 tabular-nums font-grotesk">
                        {def.format === "hearts" ? (
                          <span className="flex items-center gap-1">
                            {formatBentoValue(def, custom[def.key])}
                            <span>×</span>
                            <img
                              src="/heart.png"
                              alt=""
                              className="w-5 h-5"
                              style={{ imageRendering: "pixelated" }}
                            />
                          </span>
                        ) : (
                          formatBentoValue(def, custom[def.key])
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
