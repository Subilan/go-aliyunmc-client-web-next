import type { Preferences } from '~/types/Preferences';
import { put } from '~/utils/requests';

export default async function updatePreferences(prefs: Preferences) {
	return put('/user/preferences', prefs);
}
