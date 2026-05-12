import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton
} from '@mui/material';
import { InfoIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import useStateNamed from '~/hooks/useStateNamed';

export default function PageHeader(props: {
	children: ReactNode;
	actions?: ReactNode;
	info?: ReactNode;
}) {
	const dialogOpen = useStateNamed(false);

	return (
		<>
			<div className="flex items-center mb-6">
				<h1 className="text-3xl mr-2">{props.children}</h1>
				{props.info && (
					<IconButton onClick={() => dialogOpen.set(true)}>
						<InfoIcon size={16} />
					</IconButton>
				)}
				<div className="flex-1" />
				{props.actions}
			</div>
			<Dialog
				open={dialogOpen.current}
				onClose={() => dialogOpen.set(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>{props.children}</DialogTitle>
				<DialogContent>
					<div className="prose">{props.info}</div>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => dialogOpen.set(false)}>关闭</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
