export interface ChineseOrEnglish {
	chineseName: string;
	englishName: string;
}

export interface McTranslation {
	biomes: Record<string, ChineseOrEnglish>;
	entities: Record<string, ChineseOrEnglish>;
	blocksAndItems: Record<string, ChineseOrEnglish>;
	stats: Record<string, ChineseOrEnglish>;
}
