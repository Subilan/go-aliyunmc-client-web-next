import type { ReactNode } from 'react';

export function CardLabel(props: { children: ReactNode }) {
	return <div className="tracking-wider text-sm mb-4">{props.children}</div>;
}
