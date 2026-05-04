import { get } from '~/utils/requests';
import type { Task } from '~/types/Task';
import type { ChartPoint } from '~/components/player-count-chart';

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

export function getPlayerCountHistory() {
	return get<Array<{ time: string; playerCount: number }>>('/samples/player-count-history');
}

export function getIdleRemainingSecs() {
	return get<number>('/monitor/auto-archive-idle/remaining-secs');
}
