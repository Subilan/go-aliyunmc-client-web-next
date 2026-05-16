import { useEffect } from 'react';
import type { StateSnapshot } from '~/types/StateSnapshot';
import type { ServerStatus } from '~/types/ServerStatus';

interface SSESyncDeps {
	srvValue: StateSnapshot<ServerStatus> | null;
	instValue: StateSnapshot<string> | null;
	setServerOnline: (v: boolean) => void;
	setPlayerCount: (v: number) => void;
	setInstanceStatus: (v: string) => void;
	setInstanceNotFound: (v: boolean) => void;
}

export function useSSESync({
	srvValue,
	instValue,
	setServerOnline,
	setPlayerCount,
	setInstanceStatus,
	setInstanceNotFound
}: SSESyncDeps) {
	useEffect(() => {
		if (srvValue) {
			if (srvValue.Error) {
				setServerOnline(false);
				setPlayerCount(0);
			} else {
				setServerOnline(srvValue.Value.online);
				setPlayerCount(srvValue.Value.playerCount);
			}
		}
	}, [srvValue]);

	useEffect(() => {
		if (instValue) {
			if (instValue.Error) {
				setInstanceNotFound(true);
			} else {
				setInstanceStatus(instValue.Value);
			}
		}
	}, [instValue]);
}
