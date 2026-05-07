import { useCallback, useContext } from 'react';
import { McTranslationContext } from '~/contexts/mctranslations';

export function useMcTranslate() {
	const translation = useContext(McTranslationContext);

	return useCallback(
		(key: string) => {
            if (!key.startsWith('minecraft:')) key = 'minecraft:' + key;
			if (translation?.biomes[key]) {
				return translation.biomes[key].chineseName || translation.biomes[key].englishName;
			}
			if (translation?.entities[key]) {
				return (
					translation.entities[key].chineseName || translation.entities[key].englishName
				);
			}
			if (translation?.blocksAndItems[key]) {
				return (
					translation.blocksAndItems[key].chineseName ||
					translation.blocksAndItems[key].englishName
				);
			}
			return key;
		},
		[translation]
	);
}
