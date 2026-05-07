import type { McTranslation } from '~/types/McTranslations';
import { get } from '~/utils/requests';

export async function getMcTranslations() {
	const result = await get<McTranslation>('/simple/mc-translations');
	if (result.error) {
		return null;
	}

	return result.data;
}
