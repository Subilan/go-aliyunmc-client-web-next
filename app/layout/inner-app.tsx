import { Outlet, useLocation, useNavigate } from 'react-router';
import { Breadcrumbs, IconButton, Typography } from '@mui/material';
import { ArrowLeftIcon } from 'lucide-react';
import { PAGE_CATEGORY_INFORMATION, PAGE_CATEGORY_GAME } from "~/consts/page-categories";
import { PAGE_NAME_ECONOMY, PAGE_NAME_ECS_CANDIDATES, PAGE_NAME_TASK_LIST, PAGE_NAME_GAME_STATISTICS, PAGE_NAME_LEADERBOARD, PAGE_NAME_WEB_CHAT } from '~/consts/page-names';

const pageMeta: Record<string, { group: string; label: string }> = {
	'/info/tasks': { group: PAGE_CATEGORY_INFORMATION, label: PAGE_NAME_TASK_LIST },
	'/info/ecs-candidates': { group: PAGE_CATEGORY_INFORMATION, label: PAGE_NAME_ECS_CANDIDATES },
	'/info/economy': { group: PAGE_CATEGORY_INFORMATION, label: PAGE_NAME_ECONOMY },
	'/game/statistics': { group: PAGE_CATEGORY_GAME, label: PAGE_NAME_GAME_STATISTICS },
	'/game/leaderboard': { group: PAGE_CATEGORY_GAME, label: PAGE_NAME_LEADERBOARD },
	'/game/web-chat': { group: PAGE_CATEGORY_GAME, label: PAGE_NAME_WEB_CHAT }
};

export default function InnerAppLayout() {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const meta = pageMeta[pathname];

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
