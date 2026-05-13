import { Outlet, useLocation, useNavigate } from 'react-router';
import { Breadcrumbs, IconButton, Typography } from '@mui/material';
import { ArrowLeftIcon } from 'lucide-react';
import { getPageMeta } from '~/utils/page-meta';

export default function InnerAppLayout() {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const meta = getPageMeta(pathname);

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
