import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Spinner } from '~/components/ui/spinner';

export interface MetricItem {
	icon?: ReactNode;
	label: string;
	value: ReactNode;
	loading?: boolean;
	subtitle?: ReactNode;
}

export default function MetricCard({
	title,
	metrics,
	cols = 3,
	className
}: {
	title?: string;
	metrics: MetricItem[];
	cols?: number;
	className?: string;
}) {
	const colsClass =
		cols === 4
			? 'grid-cols-2 md:grid-cols-4'
			: 'grid-cols-2 md:grid-cols-3';

	return (
		<Card className={className}>
			{title && (
				<CardHeader>
					<CardTitle className="tracking-wider text-sm font-normal text-muted-foreground">
						{title}
					</CardTitle>
				</CardHeader>
			)}
			<CardContent>
				<div className={`grid gap-6 ${colsClass}`}>
					{metrics.map((m, i) => (
						<div key={i}>
							<div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
								{m.icon}
								{m.label}
							</div>
							<div className="text-3xl font-bold">
								{m.loading ? <Spinner /> : (m.value ?? '—')}
							</div>
							{m.subtitle && (
								<div className="text-xs text-muted-foreground mt-1">
									{m.subtitle}
								</div>
							)}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
