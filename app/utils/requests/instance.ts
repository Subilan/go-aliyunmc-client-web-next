import { get, del } from '~/utils/requests';
import type { Instance } from '~/types/Instance';
import type { EcsCandidate } from '~/types/EcsCandidate';

export function getActiveInstance() {
	return get<Instance>('/instance/active');
}

export function getCandidates() {
	return get<EcsCandidate[]>('/instance/candidates');
}

export function deleteActiveInstance() {
	return del('/instance/active');
}
