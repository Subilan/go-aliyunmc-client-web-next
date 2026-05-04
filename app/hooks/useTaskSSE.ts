import { useEffect, useRef, useState } from 'react';
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
	const doneRef = useRef(false);

	useEffect(() => {
		if (taskId === null) return;

		let abortSSE: (() => void) | null = null;
		let wasHidden = false;
		let mounted = true;

		async function loadAndConnect() {
			const { data: task } = await getTask(taskId!);
			if (!task || !mounted) return;

			const existingLines: TaskOutput[] = task.output
				? task.output.split('\n').filter(Boolean).map(line => ({
						step: task.step,
						output: line
					}))
				: [];

			setOutputs(existingLines);
			setStatus(task.status);

			if (task.status === 'success' || task.status === 'failed') {
				setDone(true);
				doneRef.current = true;
				if (task.status === 'failed') setError(task.error);
				return;
			}

			abortSSE = connectTaskSSE(taskId!, {
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
					doneRef.current = true;
					if (!success) setError(err);
				},
				onError(err) {
					console.error('SSE error:', err);
				}
			});
		}

		loadAndConnect();

		function handleVisibilityChange() {
			if (document.hidden) {
				wasHidden = true;
			} else if (wasHidden && !doneRef.current) {
				wasHidden = false;
				if (abortSSE) abortSSE();
				loadAndConnect();
			}
		}

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			mounted = false;
			if (abortSSE) abortSSE();
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [taskId]);

	return { outputs, status, done, error };
}
