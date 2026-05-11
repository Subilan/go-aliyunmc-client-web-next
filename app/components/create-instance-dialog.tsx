import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Table,
	TableBody,
	TableCell,
	TableRow
} from '@mui/material';
import type { EcsCandidate } from '~/types/EcsCandidate';

export default function CreateInstanceDialog({
	open,
	onClose,
	bestCandidate,
	onTriggered,
	loading
}: {
	open: boolean;
	onClose: () => void;
	bestCandidate: EcsCandidate | null;
	onTriggered: () => void;
	loading: boolean;
}) {
	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth keepMounted>
			<DialogTitle>创建实例</DialogTitle>
			<DialogContent>
				{bestCandidate && (
					<div className="mb-4">
						<Table size="small">
							<TableBody>
								<TableRow>
									<TableCell className="text-neutral-500">规格</TableCell>
									<TableCell>
										<code className="text-xs bg-neutral-100 px-1 py-0.5 rounded">
											{bestCandidate.instanceType}
										</code>
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="text-neutral-500">可用区</TableCell>
									<TableCell>{bestCandidate.zoneId}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="text-neutral-500">vCPU</TableCell>
									<TableCell>{bestCandidate.cpuCoreCount}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="text-neutral-500">内存</TableCell>
									<TableCell>{bestCandidate.memory} GiB</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="text-neutral-500">价格</TableCell>
									<TableCell>
										¥{bestCandidate.tradePrice.toFixed(2)} /小时
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</div>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={loading}>
					取消
				</Button>
				<Button variant="contained" onClick={onTriggered} disabled={loading}>
					{loading ? '创建中...' : '创建'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
