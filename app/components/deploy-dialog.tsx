import { useEffect, useRef, useState } from 'react';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle
} from '@mui/material';
import { Loader2Icon } from 'lucide-react';
import { useTaskSSE } from '~/hooks/useTaskSSE';
import { Toast } from '~/root';

export default function DeployDialog({
	open,
	onClose,
	onDeployed,
	deployTaskId,
	onDeployTaskIdChange,
	onRunningChange
}: {
	open: boolean;
	onClose: () => void;
	onDeployed: () => void;
	deployTaskId: number | null;
	onDeployTaskIdChange: (id: number | null) => void;
	onRunningChange: (running: boolean) => void;
}) {
	const [phase, setPhase] = useState<'deploying' | 'done'>(
		deployTaskId ? 'deploying' : 'done'
	);

	const deploySSE = useTaskSSE(deployTaskId);
	const outputsEndRef = useRef<HTMLDivElement>(null);

	// Auto-scroll on new output
	useEffect(() => {
		outputsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [deploySSE.outputs.length]);

	// When deploy task is done
	useEffect(() => {
		if (!deploySSE.done || phase !== 'deploying') return;

		if (deploySSE.error) {
			Toast.error('部署失败: ' + deploySSE.error);
		}
		onRunningChange(false);
		finish();
	}, [deploySSE.done]);

	// Sync phase when deployTaskId becomes non-null (e.g. after page refresh)
	useEffect(() => {
		if (deployTaskId) {
			setPhase('deploying');
		}
	}, [deployTaskId]);

	function finish() {
		setPhase('done');
		onRunningChange(false);
		onDeployTaskIdChange(null);
		Toast.success('部署成功');
		onDeployed();
		onClose();
	}

	const outputs = deploySSE.outputs;
	const currentStep = outputs.length > 0 ? outputs[outputs.length - 1].step : 0;

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth keepMounted>
			<DialogTitle>部署实例</DialogTitle>
			<DialogContent>
				{phase === 'deploying' && (
					<div className="mb-4">
						<div className="text-sm text-neutral-500 mb-2 flex items-center gap-2">
							<span>正在部署...</span>
							{currentStep > 0 && (
								<span className="text-blue-500 font-mono text-xs">
									步骤 {currentStep}
								</span>
							)}
						</div>
						<div className="border rounded p-3 max-h-64 overflow-y-auto">
							<pre className="text-xs font-mono whitespace-pre-wrap break-all m-0">
								{outputs.length === 0 && (
									<span className="text-neutral-400">等待输出...</span>
								)}
								{outputs.map((o, i) => (
									<span key={i}>{o.output + '\n'}</span>
								))}
							</pre>
							<div ref={outputsEndRef} />
						</div>
					</div>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>
					{phase === 'deploying' ? '后台执行' : '关闭'}
				</Button>
				{phase === 'deploying' && (
					<Button
						variant="contained"
						disabled
						startIcon={<Loader2Icon size={16} className="animate-spin" />}
					>
						部署中...
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}
