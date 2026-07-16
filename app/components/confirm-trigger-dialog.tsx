import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';

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
		<Dialog open={open} onOpenChange={v => !v && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={loading}>
						取消
					</Button>
					<Button onClick={onConfirm} disabled={loading}>
						{loading ? '触发中...' : '确认'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
