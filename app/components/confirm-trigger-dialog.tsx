import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle
} from '@mui/material';

interface ConfirmTriggerDialogProps {
	open: boolean;
	onClose: () => void;
	title: string;
	description: string;
	onConfirm: () => Promise<void>;
	loading: boolean;
}

export default function ConfirmTriggerDialog({
	open,
	onClose,
	title,
	description,
	onConfirm,
	loading
}: ConfirmTriggerDialogProps) {
	return (
		<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<DialogContentText>{description}</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={loading}>
					取消
				</Button>
				<Button variant="contained" onClick={onConfirm} disabled={loading}>
					{loading ? '触发中...' : '确认'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
