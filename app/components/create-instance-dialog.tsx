import { useContext, useEffect, useRef, useState } from 'react';
import {
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Table,
	TableBody,
	TableCell,
	TableRow
} from '@mui/material';
import { Loader2Icon } from 'lucide-react';
import type { EcsCandidate } from '~/types/EcsCandidate';
import { triggerTask } from '~/utils/requests/task';
import { useTaskSSE } from '~/hooks/useTaskSSE';
import { Toast } from '~/root';
import { UserContext } from '~/contexts/user';
import { isBasicUser } from '~/types/User';

type Phase = 'idle' | 'creating' | 'deploying' | 'starting' | 'done';

export default function CreateInstanceDialog({
	open,
	onClose,
	bestCandidate,
	onCreated,
	onTaskChange,
	createTaskId,
	onCreateTaskIdChange,
	deployTaskId,
	onDeployTaskIdChange,
	startTaskId,
	onStartTaskIdChange,
	onRunningChange
}: {
	open: boolean;
	onClose: () => void;
	bestCandidate: EcsCandidate | null;
	onCreated: () => void;
	onTaskChange: () => void;
	createTaskId: number | null;
	onCreateTaskIdChange: (id: number | null) => void;
	deployTaskId: number | null;
	onDeployTaskIdChange: (id: number | null) => void;
	startTaskId: number | null;
	onStartTaskIdChange: (id: number | null) => void;
	onRunningChange: (running: boolean) => void;
}) {
	const [phase, setPhase] = useState<Phase>(() => {
		if (startTaskId) return 'starting';
		if (createTaskId) return deployTaskId ? 'deploying' : 'creating';
		return 'idle';
	});
	const [oneClick, setOneClick] = useState(true);
	const createInitiatedRef = useRef(false);

	const createSSE = useTaskSSE(createTaskId);
	const deploySSE = useTaskSSE(deployTaskId);
	const startSSE = useTaskSSE(startTaskId);

	const outputsEndRef = useRef<HTMLDivElement>(null);

	// Auto-scroll on new output
	useEffect(() => {
		outputsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [createSSE.outputs.length, deploySSE.outputs.length, startSSE.outputs.length]);

	// When create task is done
	useEffect(() => {
		if (!createSSE.done || phase !== 'creating') return;

		if (createSSE.error) {
			Toast.error('创建实例失败: ' + createSSE.error);
			onRunningChange(false);
			onCreateTaskIdChange(null);
			return;
		} else {
			Toast.success('实例创建成功')
		}

		if (oneClick) {
			setPhase('deploying');
			triggerTask('deploy', {}).then(res => {
				if (res.data) {
					onDeployTaskIdChange(res.data.ID);
					onTaskChange();
				} else {
					Toast.error('触发部署失败: ' + res.error);
					finish();
				}
			});
		} else {
			finish();
		}
	}, [createSSE.done]);

	// When deploy task is done
	useEffect(() => {
		if (!deploySSE.done || phase !== 'deploying') return;
		if (!createInitiatedRef.current) return;

		if (deploySSE.error) {
			Toast.error('部署失败: ' + deploySSE.error);
			onRunningChange(false);
			finish();
			return;
		}

		if (oneClick) {
			setPhase('starting');
			triggerTask('start_server', {}).then(res => {
				if (res.data) {
					onStartTaskIdChange(res.data.ID);
					onTaskChange();
				} else {
					Toast.error('触发启动服务器失败: ' + res.error);
					finish();
				}
			});
		} else {
			finish();
		}
	}, [deploySSE.done]);

	// When start task is done
	useEffect(() => {
		if (!startSSE.done || phase !== 'starting') return;
		if (!createInitiatedRef.current) return;

		if (startSSE.error) {
			Toast.error('启动服务器失败: ' + startSSE.error);
		} else {
			Toast.success('服务器启动成功');
		}
		onRunningChange(false);
		finish();
	}, [startSSE.done]);

	function finish() {
		setPhase('done');
		onRunningChange(false);
		onCreateTaskIdChange(null);
		onDeployTaskIdChange(null);
		onStartTaskIdChange(null);
		onCreated();
		onClose();
	}

	function handleCreate() {
		setPhase('creating');
		onRunningChange(true);
		createInitiatedRef.current = true;
		triggerTask('create_instance', {
			useDefaultVSwitch: true,
			startWhenCreated: true
		}).then(res => {
			if (res.data) {
				onCreateTaskIdChange(res.data.ID);
				onTaskChange();
			} else {
				Toast.error('触发创建失败: ' + res.error);
				setPhase('idle');
				onRunningChange(false);
			}
		});
	}

	const isRunning = phase === 'creating' || phase === 'deploying' || phase === 'starting';
	const allOutputs =
		phase === 'deploying'
			? [...createSSE.outputs, ...deploySSE.outputs]
			: phase === 'starting'
				? [...createSSE.outputs, ...deploySSE.outputs, ...startSSE.outputs]
				: createSSE.outputs;

	const currentStep = allOutputs.length > 0 ? allOutputs[allOutputs.length - 1].step : 0;

	// Sync phase when task IDs become non-null (e.g. after page refresh)
	useEffect(() => {
		if (startTaskId) {
			setPhase('starting');
		} else if (deployTaskId) {
			setPhase('deploying');
		} else if (createTaskId) {
			setPhase('creating');
		}
	}, [createTaskId, deployTaskId, startTaskId]);

	// Reset to idle when dialog opens without an ongoing task
	useEffect(() => {
		if (open && !createTaskId && !deployTaskId && !startTaskId) {
			setPhase('idle');
		}
	}, [open, createTaskId, deployTaskId, startTaskId]);

	const user = useContext(UserContext);
	let canSkipOneClick = false;
	if (user !== null) {
		canSkipOneClick = !isBasicUser(user);
	}

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth keepMounted>
			<DialogTitle>创建实例</DialogTitle>
			<DialogContent>
				{phase === 'idle' && bestCandidate && (
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

				{isRunning && (
					<div className="mb-4">
						<div className="text-sm text-neutral-500 mb-2 flex items-center gap-2">
							<span>
								{phase === 'creating'
									? '正在创建实例...'
									: phase === 'deploying'
										? '正在部署...'
										: '正在启动服务器...'}
							</span>
							{currentStep > 0 && (
								<span className="text-blue-500 font-mono text-xs">
									步骤 {currentStep}
								</span>
							)}
						</div>
						<div className="border rounded p-3 max-h-64 overflow-y-auto">
							<pre className="text-xs font-mono whitespace-pre-wrap break-all m-0">
								{allOutputs.length === 0 && (
									<span className="text-neutral-400">等待输出...</span>
								)}
								{allOutputs.map((o, i) => (
									<span key={i}>{o.output + '\n'}</span>
								))}
							</pre>
							<div ref={outputsEndRef} />
						</div>
					</div>
				)}

				{phase === 'idle' && (
					<FormControlLabel
						control={
							<Checkbox
								checked={oneClick}
								disabled={!canSkipOneClick}
								onChange={(_, v) => setOneClick(v)}
								size="small"
							/>
						}
						label="一键创建"
					/>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>{isRunning ? '后台执行' : '取消'}</Button>
				{phase === 'idle' && (
					<Button variant="contained" onClick={handleCreate}>
						创建
					</Button>
				)}
				{isRunning && (
					<Button
						variant="contained"
						disabled
						startIcon={<Loader2Icon size={16} className="animate-spin" />}
					>
						{phase === 'creating'
							? '创建中...'
							: phase === 'deploying'
								? '部署中...'
								: '启动中...'}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}
