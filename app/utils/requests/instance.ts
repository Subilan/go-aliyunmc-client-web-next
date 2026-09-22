import { get, post, del } from '~/utils/requests';
import type { Instance } from '~/types/Instance';
import type { EcsCandidate } from '~/types/EcsCandidate';
import type { SpotInterruptionState } from '~/types/SpotInterruption';
import type { StateSnapshot } from '~/types/StateSnapshot';

export function getActiveInstance() {
	return get<Instance>('/instance/active');
}

export function getCandidates() {
	return get<EcsCandidate[]>('/instance/candidates');
}

export function deleteActiveInstance() {
	return del('/instance/active');
}

export function startInstance() {
	return post('/instance/start', {});
}

export function getSpotInterruption() {
	return get<StateSnapshot<SpotInterruptionState>>('/state/snapshot/spot-interruption');
}
