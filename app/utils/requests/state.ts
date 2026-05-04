import { get } from '~/utils/requests';
import type { ServerStatus } from '~/types/ServerStatus';
import type { StateSnapshot } from '~/types/StateSnapshot';

export function getServerStatus() {
	return get<StateSnapshot<ServerStatus>>('/state/snapshot/server-status');
}

export function getInstanceStatus() {
	return get<StateSnapshot<string>>('/state/snapshot/instance-status');
}
