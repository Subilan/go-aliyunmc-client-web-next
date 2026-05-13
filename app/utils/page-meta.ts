import { PAGE_CATEGORY_GAME } from '~/consts/page-categories';
import { PAGE_NAME_GAME_STATISTICS } from '~/consts/page-names';
import { groups } from '~/routes/all';

export interface PageMetaEntry {
	group: string;
	label: string;
}

const pageMeta: Record<string, PageMetaEntry> = Object.fromEntries(
	groups
		.filter(g => g.cards.length > 0)
		.flatMap(g => g.cards.map(c => [c.to, { group: g.title, label: c.title }] as const))
);

pageMeta['/game/statistics/'] = { group: PAGE_CATEGORY_GAME, label: PAGE_NAME_GAME_STATISTICS };

export function getPageMeta(pathname: string): PageMetaEntry | undefined {
	return pageMeta[pathname]
		?? Object.entries(pageMeta).find(([k]) => k.endsWith('/') && pathname.startsWith(k))?.[1];
}
