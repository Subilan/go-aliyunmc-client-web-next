import { post, get } from '~/utils/requests';
import type { Task } from '~/types/Task';

export function triggerTask(type: string, args: Record<string, any>) {
	return post<Task>('/task/trigger', { type, args });
}

export function getTask(id: number) {
	return get<Task>('/task/' + id);
}

export function getTaskDefinition(taskType: string) {
	return get<any>('/task/definition/' + taskType);
}
