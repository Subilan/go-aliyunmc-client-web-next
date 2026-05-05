import { useEffect, useRef, useState } from 'react';
import { connectStateSSE } from '~/utils/sse';
import type { StateSnapshot } from '~/types/StateSnapshot';

export function useStateSSE<T>(path: string, snapshotEvent: string, updateEvent: string) {
	const [value, setValue] = useState<StateSnapshot<T> | null>(null);
	const valueRef = useRef<StateSnapshot<T> | null>(null);

	useEffect(() => {
		let abortSSE: (() => void) | null = null;
		let wasHidden = false;
		let mounted = true;

		function connect() {
			abortSSE = connectStateSSE<T>(path, snapshotEvent, updateEvent, {
				onSnapshot(data) {
					if (!mounted) return;
					valueRef.current = data;
					setValue(data);
				},
				onUpdate(data) {
					if (!mounted) return;
					valueRef.current = data;
					setValue(data);
				},
				onError(err) {
					console.error('State SSE error:', err);
				}
			});
		}

		connect();

		function handleVisibilityChange() {
			if (document.hidden) {
				wasHidden = true;
			} else if (wasHidden) {
				wasHidden = false;
				if (abortSSE) abortSSE();
				connect();
			}
		}

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			mounted = false;
			if (abortSSE) abortSSE();
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [path, snapshotEvent, updateEvent]);

	return { value, valueRef };
}
