import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableRow
} from '~/components/ui/table';
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
		<Dialog open={open} onOpenChange={v => !v && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>创建实例</DialogTitle>
				</DialogHeader>
				{bestCandidate && (
					<div className="mb-4">
						<Table>
							<TableBody>
								<TableRow>
									<TableCell className="text-muted-foreground">规格</TableCell>
									<TableCell>
										<code className="text-xs bg-muted px-1 py-0.5 rounded">
											{bestCandidate.instanceType}
										</code>
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="text-muted-foreground">可用区</TableCell>
									<TableCell>{bestCandidate.zoneId}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="text-muted-foreground">vCPU</TableCell>
									<TableCell>{bestCandidate.cpuCoreCount}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="text-muted-foreground">内存</TableCell>
									<TableCell>{bestCandidate.memory} GiB</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="text-muted-foreground">价格</TableCell>
									<TableCell>
										¥{bestCandidate.tradePrice.toFixed(2)} /小时
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</div>
				)}
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={loading}>
						取消
					</Button>
					<Button onClick={onTriggered} disabled={loading}>
						{loading ? '创建中...' : '创建'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
