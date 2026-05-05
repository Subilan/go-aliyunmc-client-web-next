import { get } from '~/utils/requests';
import type { Task } from '~/types/Task';
import type {
	PlayerListChartPoint,
	PlayerListChartPointRaw
} from '~/components/player-count-chart';
import type { BalanceChartPointRaw } from '~/components/balance-chart';

export interface TaskStats {
	total: number;
	successCount: number;
	lastCompletedAt?: string;
	lastCreatedBy?: number;
	lastCreatedUser?: { ID: number; username: string };
}

export function getTaskStats() {
	return get<TaskStats>('/task/stats');
}

export function getTasks(params?: {
	limit?: number;
	offset?: number;
	sort?: string;
	order?: string;
}) {
	return get<{ tasks: Task[]; total: number }>('/task/s', {
		limit: params?.limit ?? 20,
		offset: params?.offset,
		sort: params?.sort ?? 'created_at',
		order: params?.order ?? 'desc'
	});
}

export function getBalance() {
	return get<number>('/bss/balance');
}

export async function getPlayerListHistory(): Promise<
	{ data: PlayerListChartPoint[]; error: null } | { data: null; error: string }
> {
	const raw = await get<PlayerListChartPointRaw[]>('/samples/player-list-history');
	if (raw.error !== null) return raw;
	return {
		data: raw.data.map(d => ({
			time: d.time,
			playerNames: d.playerNames === '' ? [] : d.playerNames.split(',')
		})),
		error: null
	};
}

export function getIdleRemainingSecs() {
	return get<number>('/monitor/auto-archive-idle/remaining-secs');
}

export function getAccountBalanceHistory() {
	return get<BalanceChartPointRaw[]>('/samples/account-balance-history');
}
