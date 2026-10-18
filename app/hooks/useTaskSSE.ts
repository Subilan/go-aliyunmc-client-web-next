import { useEffect, useState } from 'react';
import { getTask } from '~/utils/requests/task';
import { connectTaskSSE } from '~/utils/sse';

interface TaskOutput {
	step: number;
	output: string;
}

export function useTaskSSE(taskId: number | null) {
	const [outputs, setOutputs] = useState<TaskOutput[]>([]);
	const [status, setStatus] = useState<string | null>(null);
	const [done, setDone] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// 新任务从干净状态开始，否则上一次的 done 会吞掉本次完成回调。
		setOutputs([]);
		setStatus(null);
		setDone(false);
		setError(null);

		if (taskId === null) return;

		let abortSSE: (() => void) | null = null;
		let mounted = true;

		async function loadAndConnect() {
			const { data: task } = await getTask(taskId!);
			if (!task || !mounted) return;

			setStatus(task.status);

			if (task.status === 'success' || task.status === 'failed') {
				setOutputs(
					task.output
						? task.output.split('\n').filter(Boolean).map(line => ({
								step: task.step,
								output: line
							}))
						: []
				);
				setDone(true);
				if (task.status === 'failed') setError(task.error);
				return;
			}

			// 带 Last-Event-ID: 0 连接，服务端会先回放已持久化输出再接实时事件。
			abortSSE = connectTaskSSE(
				taskId!,
				{
					onOutput(step, output) {
						if (!mounted) return;
						setOutputs(prev => [...prev, { step, output }]);
					},
					onStatusChange(newStatus) {
						if (!mounted) return;
						setStatus(newStatus);
					},
					onDone(success, err) {
						if (!mounted) return;
						setDone(true);
						if (!success) setError(err);
					},
					onError(err) {
						console.error('SSE error:', err);
					}
				},
				{ lastEventId: 0 }
			);
		}

		loadAndConnect();

		return () => {
			mounted = false;
			if (abortSSE) abortSSE();
		};
	}, [taskId]);

	return { outputs, status, done, error };
}
