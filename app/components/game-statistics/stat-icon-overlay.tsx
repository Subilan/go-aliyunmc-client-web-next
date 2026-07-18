import { useCallback, useRef, useEffect, type CSSProperties } from 'react';
import useStateNamed from '~/hooks/useStateNamed';

interface MetricCardProps {
	label: string;
	value: string;
	sub?: string;
}

function MetricCard({ label, value, sub, style }: MetricCardProps & { style?: CSSProperties }) {
	return (
		<div className="rounded-lg p-4 bg-white/10 hover:bg-white/15 transition-colors cursor-default" style={style}>
			<div className="text-sm text-white/60">{label}</div>
			<div className="text-2xl font-bold text-white tabular-nums font-grotesk mt-1">
				{value}
			</div>
			{sub && <div className="text-sm text-white/50 mt-0.5 truncate">{sub}</div>}
		</div>
	);
}

interface TopRow {
	rank: number;
	name: string;
	count: number;
	pct: string;
}

function RestRow({ rows, style, skipAnimation }: { rows: TopRow[]; style?: CSSProperties; skipAnimation?: boolean }) {
	if (rows.length === 0) return null;
	return (
		<div className="w-full rounded-lg p-4 bg-white/10" style={style}>
			<div className="flex flex-col gap-2">
				{rows.map((r, i) => (
					<div
						key={r.rank}
						className="flex items-center gap-3"
						style={
							skipAnimation
								? undefined
								: {
										animation: 'card-fade-in 0.3s ease-out both',
										animationDelay: `${220 + i * 50}ms`
									}
						}
					>
						<span className="text-white/30 w-4 text-xs tabular-nums font-grotesk">#{r.rank}</span>
						<span className="text-white truncate flex-1">{r.name}</span>
						<span className="text-white/70 tabular-nums text-sm font-grotesk">{r.count.toLocaleString()}</span>
						<span className="text-white/40 tabular-nums text-xs font-grotesk w-11 text-right">{r.pct}%</span>
					</div>
				))}
			</div>
		</div>
	);
}

interface StatIconOverlayProps {
	icon: string;
	title: string;
	description: string;
	items: [string, number][];
	translate: (key: string) => string;
}

type Phase = 'hidden' | 'showing' | 'hiding';

function staggerDelay(base: number, gap: number, index: number, skip: boolean): CSSProperties | undefined {
	if (skip) return undefined;
	return { animation: 'card-fade-in 0.3s ease-out both', animationDelay: `${base + index * gap}ms` };
}

export function StatIconOverlay({ icon, title, description, items, translate }: StatIconOverlayProps) {
	const phase = useStateNamed<Phase>('hidden');
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const showCount = useRef(0);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	const show = useCallback(() => {
		if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) return;
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		showCount.current += 1;
		phase.set('showing');
	}, [phase]);

	const hide = useCallback(() => {
		phase.set('hiding');
		timerRef.current = setTimeout(() => {
			phase.set('hidden');
		}, 250);
	}, [phase]);

	const sorted = [...items].sort((a, b) => b[1] - a[1]);
	const total = sorted.reduce((sum, [, v]) => sum + v, 0);
	const top1 = sorted[0] ?? null;
	const top1Pct = top1 && total > 0 ? ((top1[1] / total) * 100).toFixed(1) : '0';
	const restRows: TopRow[] = sorted.slice(1, 5).map(([k, v], i) => ({
		rank: i + 2,
		name: translate(k),
		count: v,
		pct: total > 0 ? ((v / total) * 100).toFixed(1) : '0'
	}));

	const isVisible = phase.current === 'showing' || phase.current === 'hiding';
	const anim = phase.current === 'hiding' ? 'overlay-zoom-out 0.25s cubic-bezier(0.4, 0, 0, 1) forwards' : 'overlay-zoom-in 0.25s cubic-bezier(0.4, 0, 0, 1) forwards';
	const bgAnim = phase.current === 'hiding' ? 'overlay-bg-out 0.25s cubic-bezier(0.4, 0, 0, 1) forwards' : 'overlay-bg-in 0.25s cubic-bezier(0.4, 0, 0, 1) forwards';

	const skip = showCount.current > 1;

	return (
		<div className="w-10 h-10 mb-1 flex items-start justify-center">
			<img
				src={icon}
				alt=""
				className="w-10 h-10"
				style={{ imageRendering: 'pixelated' }}
				onMouseEnter={show}
				onMouseLeave={hide}
			/>

			{isVisible && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center"
					style={{ pointerEvents: 'none' }}
				>
					<div
						className="absolute inset-0"
						style={{
							backgroundColor: 'rgba(0, 0, 0, 0.7)',
							backdropFilter: 'blur(8px)',
							WebkitBackdropFilter: 'blur(8px)',
							animation: bgAnim
						}}
					/>
					<div
						className="relative flex flex-col items-center gap-6 px-6 py-10 w-full max-w-xl"
						style={{ animation: anim }}
					>
						<img
							src={icon}
							alt=""
							className="w-20 h-20"
							style={{ imageRendering: 'pixelated' }}
						/>
						<h2 className="text-3xl font-bold text-white">{title}</h2>
						<p className="text-white/70 text-lg text-center">{description}</p>
						<div className="w-full flex flex-col gap-3">
							<div className="grid grid-cols-3 gap-3">
								<MetricCard label="总计" value={total.toLocaleString()} style={staggerDelay(50, 40, 0, skip)} />
								<MetricCard label="种类" value={sorted.length.toLocaleString()} style={staggerDelay(50, 40, 1, skip)} />
								{top1 && (
									<MetricCard
										label="最多"
										value={translate(top1[0])}
										sub={`${top1[1].toLocaleString()} (${top1Pct}%)`}
										style={staggerDelay(50, 40, 2, skip)}
									/>
								)}
							</div>
							<RestRow
								rows={restRows}
								style={skip ? undefined : { animation: 'card-fade-in 0.3s ease-out both', animationDelay: '170ms' }}
								skipAnimation={skip}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
