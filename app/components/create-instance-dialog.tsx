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
	hasInstance,
	onTriggered,
	loading
}: {
	open: boolean;
	onClose: () => void;
	bestCandidate: EcsCandidate | null;
	hasInstance: boolean;
	onTriggered: () => void;
	loading: boolean;
}) {
	return (
		<Dialog open={open} onOpenChange={v => !v && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>启动游戏</DialogTitle>
				</DialogHeader>
				{bestCandidate ? (
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
				) : (
					<p className="text-sm text-muted-foreground">
						要立即启动游戏吗？
					</p>
				)}
				<DialogFooter>
					<Button variant="ghost" onClick={onClose} disabled={loading}>
						取消
					</Button>
					<Button onClick={onTriggered} disabled={loading}>
						{loading ? '触发中...' : '启动游戏'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
