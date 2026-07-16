import { PAGE_CATEGORY_GAME, PAGE_CATEGORY_INFORMATION, PAGE_CATEGORY_MISC } from '~/consts/page-categories';
import {
	PAGE_NAME_ECONOMY,
	PAGE_NAME_ECS_CANDIDATES,
	PAGE_NAME_GAME_STATISTICS,
	PAGE_NAME_LEADERBOARD,
	PAGE_NAME_PLAYER_LIST,
	PAGE_NAME_TASK_LIST,
	PAGE_NAME_UPDATES,
	PAGE_NAME_WEB_CHAT
} from '~/consts/page-names';

export interface PageMetaEntry {
	group: string;
	label: string;
}

const pageMeta: Record<string, PageMetaEntry> = {
	'/info/tasks':           { group: PAGE_CATEGORY_INFORMATION, label: PAGE_NAME_TASK_LIST },
	'/info/ecs-candidates':  { group: PAGE_CATEGORY_INFORMATION, label: PAGE_NAME_ECS_CANDIDATES },
	'/info/economy':         { group: PAGE_CATEGORY_INFORMATION, label: PAGE_NAME_ECONOMY },
	'/game/player-list':     { group: PAGE_CATEGORY_GAME,        label: PAGE_NAME_PLAYER_LIST },
	'/game/leaderboard':     { group: PAGE_CATEGORY_GAME,        label: PAGE_NAME_LEADERBOARD },
	'/game/web-chat':        { group: PAGE_CATEGORY_GAME,        label: PAGE_NAME_WEB_CHAT },
	'/updates':              { group: PAGE_CATEGORY_MISC,        label: PAGE_NAME_UPDATES },
};

pageMeta['/game/statistics/'] = { group: PAGE_CATEGORY_GAME, label: PAGE_NAME_GAME_STATISTICS };

export function getPageMeta(pathname: string): PageMetaEntry | undefined {
	const exact = pageMeta[pathname];
	if (exact) return exact;
	const keys = Object.keys(pageMeta).filter(k => pathname.startsWith(k));
	if (keys.length === 0) return undefined;
	return pageMeta[keys.reduceRight((prev, current) => (current.length > prev.length ? current : prev))];
}
