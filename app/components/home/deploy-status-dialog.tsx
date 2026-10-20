import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { ScrollArea } from '~/components/ui/scroll-area';
import { useAutoScroll } from '~/components/task-output';
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from 'lucide-react';

interface DeployStatusDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	outputs: { step: number; output: string }[];
	done: boolean;
	error: string | null;
}

// 从输出中提取当前步骤标题，例如：
// [oneclick_start_game] 阶段 2/3：部署环境
// [deploy] 执行步骤 3/12「上传服务端」
function currentStepTitle(outputs: { output: string }[]): string | null {
	for (let i = outputs.length - 1; i >= 0; i--) {
		const line = outputs[i].output;
		const phase = line.match(/\[oneclick_start_game\] 阶段 \d+\/\d+：(.*)$/);
		if (phase) return phase[1].trim();
		const step = line.match(/\[deploy\] 执行步骤 \d+\/\d+「(.*)」/);
		if (step) return step[1].trim();
	}
	return null;
}

function isStepAnnouncement(line: string) {
	return /^\[[a-z_]+\] (?:阶段 \d+\/\d+|执行步骤 \d+\/\d+)/.test(line);
}

function StatusIndicator({
	outputs,
	done,
	error
}: {
	outputs: { output: string }[];
	done: boolean;
	error: string | null;
}) {
	if (error) {
		return (
			<>
				<XCircleIcon className="size-4 text-red-500" />
				部署失败
			</>
		);
	}
	if (done) {
		return (
			<>
				<CheckCircle2Icon className="size-4 text-green-500" />
				部署完成
			</>
		);
	}
	return (
		<>
			<Loader2Icon className="size-4 animate-spin text-blue-500" />
			{currentStepTitle(outputs) ?? '准备中'}
		</>
	);
}

function OutputPanel({ outputs }: { outputs: { output: string }[] }) {
	const scrollRef = useAutoScroll(outputs.length);

	return (
		<ScrollArea
			className="bg-white"
			viewportClassName="h-[50vh] max-h-[420px]"
		>
			<div className="px-4 py-3">
				{outputs.length === 0 ? (
					<span className="text-xs text-neutral-400">等待输出...</span>
				) : (
					<div className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed">
						{outputs.map((o, i) => (
							<div
								key={i}
								className={
									isStepAnnouncement(o.output)
										? 'mt-3 font-medium text-foreground first:mt-0'
										: 'text-neutral-600'
								}
							>
								{o.output}
							</div>
						))}
					</div>
				)}
				<div ref={scrollRef} />
			</div>
		</ScrollArea>
	);
}

export default function DeployStatusDialog({
	open,
	onOpenChange,
	outputs,
	done,
	error
}: DeployStatusDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>启动进度</DialogTitle>
				</DialogHeader>
				<div className="overflow-hidden rounded-lg border border-border">
					<div className="flex items-center gap-2 border-b border-border bg-white px-4 py-2.5 text-sm">
						<StatusIndicator outputs={outputs} done={done} error={error} />
					</div>
					<OutputPanel outputs={outputs} />
				</div>
				{error && <div className="break-all text-sm text-red-600">{error}</div>}
				<DialogFooter>
					<Button variant="ghost" onClick={() => onOpenChange(false)}>
						关闭
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
