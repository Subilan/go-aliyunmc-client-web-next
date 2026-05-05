import { Outlet, useLocation, useNavigate } from 'react-router';
import { Breadcrumbs, IconButton, Link, Typography } from '@mui/material';
import { ArrowLeftIcon } from 'lucide-react';

const labelByPath: Record<string, string> = {
	'/info/tasks': '任务列表',
	'/info/ecs-candidates': 'ECS 候选实例'
};

export default function InnerAppLayout() {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const pageLabel = labelByPath[pathname] || pathname;

	return (
		<>
			<div className="flex items-center gap-2 mb-4">
				<IconButton size="small" onClick={() => navigate(-1)}>
					<ArrowLeftIcon size={18} />
				</IconButton>
				<Breadcrumbs>
					<Link
						component="button"
						underline="hover"
						color="inherit"
						onClick={() => navigate('/')}
					>
						控制台
					</Link>
					<Typography color="text.primary">{pageLabel}</Typography>
				</Breadcrumbs>
			</div>
			<Outlet />
		</>
	);
}
