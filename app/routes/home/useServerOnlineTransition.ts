import { useEffect, type RefObject } from 'react';
import type { StateSnapshot } from '~/types/StateSnapshot';
import type { ServerStatus } from '~/types/ServerStatus';
import type { ServerQuery } from '~/types/ServerQuery';
import { queryServer } from '~/utils/requests/server';

interface ServerOnlineTransitionDeps {
	srvValue: StateSnapshot<ServerStatus> | null;
	startServerTriggeredRef: RefObject<boolean>;
	setTasksRefreshKey: (updater: (k: number) => number) => void;
	serverQuery: RefObject<ServerQuery | undefined>;
	setServerStarting: (v: boolean) => void;
}

export function useServerOnlineTransition({
	srvValue,
	startServerTriggeredRef,
	setTasksRefreshKey,
	serverQuery,
	setServerStarting
}: ServerOnlineTransitionDeps) {
	useEffect(() => {
		if (srvValue?.Value.online) {
			if (startServerTriggeredRef.current) {
				startServerTriggeredRef.current = false;
				setTasksRefreshKey(k => k + 1);
			}
			queryServer().then(r => {
				if (r.error === null) serverQuery.current = r.data;
			});
			setServerStarting(false);
		}
	}, [srvValue]);
}
