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
