import { useEffect, useRef } from 'react';

export function useAutoScroll(depCount: number) {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		ref.current?.scrollIntoView({ behavior: 'smooth' });
	}, [depCount]);
	return ref;
}

export function TaskOutputLines({ outputs }: { outputs: { output: string }[] }) {
	return (
		<pre className="text-xs font-mono whitespace-pre-wrap break-all m-0">
			{outputs.length === 0 && (
				<span className="text-neutral-400">等待输出...</span>
			)}
			{outputs.map((o, i) => (
				<span key={i}>{o.output + '\n'}</span>
			))}
		</pre>
	);
}
