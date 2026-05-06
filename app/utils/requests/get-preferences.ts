import type { Preferences } from '~/types/Preferences';
import { get } from '~/utils/requests';

export default async function getPreferences() {
	return get<Preferences>('/user/preferences');
}
