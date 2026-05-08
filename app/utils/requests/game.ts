import { get } from '~/utils/requests';

export interface AdvancementEntry {
  englishName: string;
  chineseName: string;
  resourceLocation: string;
  englishDescription: string;
  chineseDescription: string;
  isGoal: boolean;
  isChallenge: boolean;
  done: boolean;
  criteria: Record<string, string>;
}

export function getAdvancements() {
  return get<AdvancementEntry[]>('/user/game/advancements');
}

export interface PlaytimeInfo {
  playtime: number;
  artificial_playtime: number;
  afk_playtime: number;
  last_seen: number | null;
  first_join: number | null;
  join_streak: number;
}

export interface CategoryProgress {
  category: string;
  completed: number;
  total: number;
}

export interface AdvancementProgress {
  total: number;
  completed: number;
  categories: CategoryProgress[];
}

export interface GameStats {
  stats: Record<string, Record<string, number>>;
  playtime: PlaytimeInfo | null;
  advancement_progress: AdvancementProgress;
  player_name: string;
  online_dates: string[];
}

export function getGameStats() {
  return get<GameStats>('/user/game/stats');
}
