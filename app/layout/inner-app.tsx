import { Outlet, useLocation, useNavigate } from 'react-router';
import { Breadcrumbs, IconButton, Typography } from '@mui/material';
import { ArrowLeftIcon } from 'lucide-react';
import { INFO_GROUP } from '~/utils/groups';

const pageMeta: Record<string, { group: string; label: string }> = {
	'/info/tasks': { group: INFO_GROUP, label: '任务列表' },
	'/info/ecs-candidates': { group: INFO_GROUP, label: '候选实例' },
	'/info/economy': { group: INFO_GROUP, label: '服务器经济' }
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
