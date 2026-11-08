import { useEffect, type RefObject } from 'react';
import type { StateSnapshot } from '~/types/StateSnapshot';
import type { ServerStatus } from '~/types/ServerStatus';

interface ServerOnlineTransitionDeps {
	srvValue: StateSnapshot<ServerStatus> | null;
	startServerTriggeredRef: RefObject<boolean>;
	setTasksRefreshKey: (updater: (k: number) => number) => void;
	setServerStarting: (v: boolean) => void;
}

export function useServerOnlineTransition({
	srvValue,
	startServerTriggeredRef,
	setTasksRefreshKey,
	setServerStarting
}: ServerOnlineTransitionDeps) {
	useEffect(() => {
		if (srvValue?.Value.online) {
			if (startServerTriggeredRef.current) {
				startServerTriggeredRef.current = false;
				setTasksRefreshKey(k => k + 1);
			}
			setServerStarting(false);
		}
	}, [srvValue]);
}
