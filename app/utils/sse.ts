import { fetchEventSource } from '@microsoft/fetch-event-source';
import { BASE_URL } from '~/utils/requests';

interface TaskSSEHandlers {
	onOutput: (step: number, output: string) => void;
	onStatusChange: (status: string) => void;
	onDone: (success: boolean, error: string) => void;
	onError: (err: any) => void;
}

export function connectTaskSSE(taskId: number, handlers: TaskSSEHandlers): () => void {
	const controller = new AbortController();

	fetchEventSource(`${BASE_URL}/task/${taskId}/output`, {
		signal: controller.signal,
		credentials: 'include',
		async onopen(response) {
			if (!response.ok) {
				handlers.onError(new Error(`SSE connection failed: ${response.status}`));
				controller.abort();
			}
		},
		onmessage(event) {
			try {
				const data = JSON.parse(event.data);
				switch (event.event) {
					case 'task_output':
						handlers.onOutput(data.step, data.output);
						break;
					case 'task_status_update':
						handlers.onStatusChange(data);
						break;
					case 'task_done':
						handlers.onDone(data.success, data.error);
						break;
				}
			} catch {
				// skip unparseable events
			}
		},
		onerror(err) {
			handlers.onError(err);
			controller.abort();
		}
	});

	return () => controller.abort();
}
