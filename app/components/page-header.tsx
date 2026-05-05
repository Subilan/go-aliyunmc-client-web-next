import type { ReactNode } from 'react';

export default function PageHeader(props: { children: ReactNode }) {
	return (
		<div className="flex items-center mb-6">
			<h1 className="text-3xl">{props.children}</h1>
			<div className="flex-1" />
		</div>
	);
}
