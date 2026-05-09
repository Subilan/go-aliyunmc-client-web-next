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

export function getAdvancements(uuid: string) {
  return get<AdvancementEntry[]>(`/server/advancements/${encodeURIComponent(uuid)}`);
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
  playtime: number;
  advancement_progress: AdvancementProgress;
  player_name: string;
  online_dates: string[];
  join_streak: number;
  last_seen: number | null;
}

export function getGameStats(uuid: string) {
  return get<GameStats>(`/server/stats/${encodeURIComponent(uuid)}`);
}

export interface LeaderboardEntry {
  uuid: string;
  player_name: string;
  value: number;
}

export function getLeaderboard(metric: string, order?: string) {
  return get<LeaderboardEntry[]>('/server/leaderboard', { metric, order: order ?? 'desc' });
}

export interface PlayerListEntry {
  uuid: string;
  name: string;
  disallow_public_game_stats: boolean;
}

export function getPlayerList() {
  return get<PlayerListEntry[]>('/server/player-list');
}
