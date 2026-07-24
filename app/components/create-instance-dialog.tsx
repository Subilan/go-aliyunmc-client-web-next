import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import type { EcsCandidate } from '~/types/EcsCandidate';

function SpecItem({ label, value }: { label: string; value: string | number }) {
	return (
		<div>
			<span className="text-xs text-muted-foreground">{label}</span>
			<p className="font-medium">{value}</p>
		</div>
	);
}

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
				<p className="text-sm text-red-800 font-medium">请不要切换页面，否则可能需要中途手动触发部署</p>
				{bestCandidate && (
					<div className="space-y-3">
						<p className="font-mono text-base font-heading font-medium">
							{bestCandidate.instanceType}
						</p>
						<div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
							<SpecItem label="vCPU" value={bestCandidate.cpuCoreCount} />
							<SpecItem label="内存" value={`${bestCandidate.memory} GiB`} />
							<SpecItem label="可用区" value={bestCandidate.zoneId} />
							<SpecItem label="价格" value={`¥${bestCandidate.tradePrice.toFixed(2)}/小时`} />
						</div>
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
