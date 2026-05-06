import { useEffect, useRef, useState } from 'react';
import { connectStateSSE } from '~/utils/sse';
import type { StateSnapshot } from '~/types/StateSnapshot';

export function useStateSSE<T>(path: string, snapshotEvent: string, updateEvent: string) {
	const [value, setValue] = useState<StateSnapshot<T> | null>(null);
	const valueRef = useRef<StateSnapshot<T> | null>(null);

	useEffect(() => {
		let mounted = true;
		const abortSSE = connectStateSSE<T>(path, snapshotEvent, updateEvent, {
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

		return () => {
			mounted = false;
			abortSSE();
		};
	}, [path, snapshotEvent, updateEvent]);

	return { value, valueRef };
}
