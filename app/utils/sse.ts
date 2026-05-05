import { fetchEventSource } from '@microsoft/fetch-event-source';
import { BASE_URL } from '~/utils/requests';
import type { StateSnapshot } from '~/types/StateSnapshot';

interface TaskSSEHandlers {
	onOutput: (step: number, output: string) => void;
	onStatusChange: (status: string) => void;
	onDone: (success: boolean, error: string) => void;
	onError: (err: any) => void;
}

interface StateSSEHandlers<T> {
	onSnapshot: (data: StateSnapshot<T>) => void;
	onUpdate: (data: StateSnapshot<T>) => void;
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

export function connectStateSSE<T>(
	path: string,
	snapshotEvent: string,
	updateEvent: string,
	handlers: StateSSEHandlers<T>
): () => void {
	const controller = new AbortController();

	fetchEventSource(`${BASE_URL}${path}`, {
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
				if (event.event === snapshotEvent) {
					handlers.onSnapshot(data);
				} else if (event.event === updateEvent) {
					handlers.onUpdate(data);
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
