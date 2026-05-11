import { Outlet, useLocation, useNavigate } from 'react-router';
import { Breadcrumbs, IconButton, Typography } from '@mui/material';
import { ArrowLeftIcon } from 'lucide-react';
import { PAGE_CATEGORY_GAME } from "~/consts/page-categories";
import { PAGE_NAME_GAME_STATISTICS } from '~/consts/page-names';
import { groups } from '~/routes/all';

const pageMeta: Record<string, { group: string; label: string }> = Object.fromEntries(
	groups
		.filter(g => g.cards.length > 0)
		.flatMap(g => g.cards.map(c => [c.to, { group: g.title, label: c.title }] as const))
);

pageMeta['/game/statistics/'] = { group: PAGE_CATEGORY_GAME, label: PAGE_NAME_GAME_STATISTICS };

export default function InnerAppLayout() {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const meta = pageMeta[pathname]
		?? Object.entries(pageMeta).find(([k]) => k.endsWith('/') && pathname.startsWith(k))?.[1];

	return (
		<>
			<div className="flex items-center gap-2 mb-4">
				<IconButton size="small" onClick={() => navigate(-1)}>
					<ArrowLeftIcon size={18} />
				</IconButton>
				<Breadcrumbs>
					{meta && (
						<Typography color="text.primary">{meta.group}</Typography>
					)}
					<Typography color="text.primary">
						{meta?.label ?? pathname}
					</Typography>
				</Breadcrumbs>
			</div>
			<Outlet />
		</>
	);
}
