import type { Model } from './Model';
import type { User } from './User';

export interface Task extends Model {
	type: string;
	startAt?: string;
	endAt?: string;
	status: 'created' | 'running' | 'success' | 'failed';
	step: number;
	output: string;
	error: string;
	by?: number;
	user?: User;
}
