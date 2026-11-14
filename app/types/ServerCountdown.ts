export type ServerCountdownStatus = 'inactive' | 'running' | 'paused' | 'finalizing';

export interface ServerCountdownState {
	enabled: boolean;
	status: ServerCountdownStatus;
	remaining_seconds: number;
	configured_seconds: number;
	has_active_instance: boolean;
}
