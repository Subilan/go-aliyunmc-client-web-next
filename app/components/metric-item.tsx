import type { ReactNode } from 'react';

export function MetricItem(props: { title: string; children?: ReactNode; centered?: boolean }) {
	return (
		<div>
			<div className="text-xs text-neutral-400 tracking-wider mb-2" style={{textAlign: props.centered ? 'center' : 'left'}}>{props.title}</div>
			<div className="text-xl font-medium" style={{textAlign: props.centered ? 'center' : 'left'}}>{props.children ?? '—'}</div>
		</div>
	);
}
