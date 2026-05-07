import { useCallback, useContext } from 'react';
import { McTranslationContext } from '~/contexts/mctranslations';
import type { McTranslation } from '~/types/McTranslations';

export function useMcTranslate(type?: keyof McTranslation) {
	const translation = useContext(McTranslationContext);

	return type === undefined
		? useCallback(
				(key: string) => {
					if (!key.startsWith('minecraft:')) key = 'minecraft:' + key;
					if (translation?.biomes[key]) {
						return (
							translation.biomes[key].chineseName ||
							translation.biomes[key].englishName
						);
					}
					if (translation?.entities[key]) {
						return (
							translation.entities[key].chineseName ||
							translation.entities[key].englishName
						);
					}
					if (translation?.blocksAndItems[key]) {
						return (
							translation.blocksAndItems[key].chineseName ||
							translation.blocksAndItems[key].englishName
						);
					}
					if (translation?.stats[key]) {
						return (
							translation.stats[key].chineseName || translation.stats[key].englishName
						);
					}
					return key;
				},
				[translation]
			)
		: useCallback(
				(key: string) => {
					if (!key.startsWith('minecraft:')) key = 'minecraft:' + key;
					if (translation && translation[type][key]) {
						return (
							translation[type][key].chineseName || translation[type][key].englishName
						);
					}
					return key;
				},
				[translation, type]
			);
}
