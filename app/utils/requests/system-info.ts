import { get } from '~/utils/requests';

export interface SystemInfo {
	version: string;
	go_version: string;
	build_time: string;
	platform: string;
	commit: string;
}

export function getSystemInfo() {
	return get<SystemInfo>('/simple/info');
}
