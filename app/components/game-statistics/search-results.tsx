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

const STAT_CATEGORIES = [
  { name: "minecraft:used", label: "使用或放置" },
  { name: "minecraft:picked_up", label: "拾取" },
  { name: "minecraft:mined", label: "挖掘" },
  { name: "minecraft:killed", label: "击杀" },
  { name: "minecraft:killed_by", label: "死于" },
  { name: "minecraft:crafted", label: "制造" },
  { name: "minecraft:broken", label: "损坏" },
] as const;

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

  const totalMatches =
    groupedMatches.reduce((sum, g) => sum + g.items.length, 0);

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
        </div>
      )}
    </>
  );
}
