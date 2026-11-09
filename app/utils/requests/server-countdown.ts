import { get, post } from '~/utils/requests';
import type { ServerCountdownState } from '~/types/ServerCountdown';

const BASE_PATH = '/monitor/auto-archive-idle';

export function getServerCountdown() {
	return get<ServerCountdownState>(BASE_PATH);
}

export function pauseServerCountdown() {
	return post<ServerCountdownState>(`${BASE_PATH}/pause`, {});
}

export function resumeServerCountdown() {
	return post<ServerCountdownState>(`${BASE_PATH}/resume`, {});
}

export function resetServerCountdown() {
	return post<ServerCountdownState>(`${BASE_PATH}/reset`, {});
}
