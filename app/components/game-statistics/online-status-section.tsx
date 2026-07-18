import { useState, useMemo } from 'react';
import { Button } from '~/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { XIcon } from 'lucide-react';

interface OnlineStatusSectionProps {
	onlineDates: string[];
}

function formatDateStr(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function formatDateDisplay(d: Date): string {
	return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function getLast7Days(): Date[] {
	const today = new Date();
	const days: Date[] = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(today.getDate() - i);
		days.push(d);
	}
	return days;
}

const DATA_START_DATE = '2026-05-12';
const LEGEND_CELL = 14;

function ContributionGrid({ onlineDates }: { onlineDates: string[] }) {
	const onlineSet = useMemo(() => new Set(onlineDates), [onlineDates]);

	const { weeks, monthAtCol } = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const start = new Date(today);
		start.setDate(today.getDate() - 60);

		const startDay = start.getDay();
		start.setDate(start.getDate() - startDay);

		const end = new Date(today);
		const endDay = end.getDay();
		if (endDay < 6) end.setDate(end.getDate() + (6 - endDay));

		const weeks: Date[][] = [];
		const current = new Date(start);
		while (current <= end) {
			const week: Date[] = [];
			for (let d = 0; d < 7; d++) {
				week.push(new Date(current));
				current.setDate(current.getDate() + 1);
			}
			weeks.push(week);
		}

		const monthAtCol: Record<number, string> = {};
		weeks.forEach((week, ci) => {
			const m = week[0].getMonth();
			if (ci === 0 || weeks[ci - 1][0].getMonth() !== m) {
				monthAtCol[ci] = `${m + 1}月`;
			}
		});

		return { weeks, monthAtCol };
	}, []);

	const colCount = weeks.length;

	return (
		<div className="w-full max-w-[400px]">
			<div
				className="grid gap-[10px] min-w-[400px]"
				style={{
					gridTemplateColumns: `20px repeat(${colCount}, 1fr)`,
					gridTemplateRows: `18px repeat(7, auto)`
				}}
			>
				<div />
				{weeks.map((week, wi) => (
					<div key={`mh-${wi}`} className="relative overflow-visible">
						{monthAtCol[wi] && (
							<span className="absolute text-xs text-muted-foreground whitespace-nowrap left-0 top-0">
								{monthAtCol[wi]}
							</span>
						)}
					</div>
				))}

				{[0, 1, 2, 3, 4, 5, 6].map(row => {
					const label = DAY_LABELS[row];
					return (
						<div key={`row-${row}`} className="contents">
							<div
								className="text-muted-foreground leading-none flex items-center"
								style={{ fontSize: 11 }}
							>
								{row % 2 === 0 ? label : ''}
							</div>
							{weeks.map((week, col) => {
								const day = week[row];
								const key = formatDateStr(day);
								const online = onlineSet.has(key);
								const isFuture = day > new Date();
								const isBeforeData = key < DATA_START_DATE;

								if (isBeforeData) {
									return (
										<div
											key={`${col}-${row}`}
											className="bg-muted rounded-md border"
											style={{ aspectRatio: '1' }}
										/>
									);
								}

								const displayDate = formatDateDisplay(day);
								const status = isFuture ? '' : online ? ' 在线' : ' 不在线';
								return (
									<Tooltip key={`${col}-${row}`}>
										<TooltipTrigger asChild>
											<div
												className={`rounded-md ${isFuture ? 'bg-transparent' : online ? 'bg-green-500' : 'bg-muted'}`}
												style={{ aspectRatio: '1' }}
											/>
										</TooltipTrigger>
										<TooltipContent>
											{displayDate + status}
										</TooltipContent>
									</Tooltip>
								);
							})}
						</div>
					);
				})}
			</div>
			<div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground justify-end">
				<span>无数据</span>
				<div
					className="bg-muted border"
					style={{ width: LEGEND_CELL, height: LEGEND_CELL, borderRadius: 3 }}
				/>
				<span>不在线</span>
				<div
					className="bg-muted"
					style={{ width: LEGEND_CELL, height: LEGEND_CELL, borderRadius: 3 }}
				/>
				<span>在线</span>
				<div
					className="bg-green-600"
					style={{ width: LEGEND_CELL, height: LEGEND_CELL, borderRadius: 3 }}
				/>
			</div>
		</div>
	);
}

export function OnlineStatusSection({ onlineDates }: OnlineStatusSectionProps) {
	const [dialogOpen, setDialogOpen] = useState(false);

	const normalizedDates = useMemo(() => onlineDates.map(d => d.slice(0, 10)), [onlineDates]);
	const onlineSet = useMemo(() => new Set(normalizedDates), [normalizedDates]);
	const last7Days = useMemo(() => getLast7Days(), []);

	return (
		<>
			<div>
				<div className="flex items-center justify-between mb-2">
					<span className="text-xs text-neutral-400 tracking-wider">近7天在线情况</span>
				</div>
				<div className="flex gap-3 justify-between py-2">
					{last7Days.map(d => {
						const key = formatDateStr(d);
						const online = onlineSet.has(key);
						const dayLabel = `${d.getMonth() + 1}/${d.getDate()}`;

						return (
							<div key={key} className="flex flex-col items-center gap-0.5">
								{online ? (
									<div className="size-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">
										✓
									</div>
								) : (
									<div className="size-8 rounded-full border-2" />
								)}
								<span className="text-xs text-neutral-400">{dayLabel}</span>
							</div>
						);
					})}
				</div>
				<div className="flex justify-end mt-2">
					<Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
						查看近期
					</Button>
				</div>
			</div>

			<Dialog open={dialogOpen} onOpenChange={v => setDialogOpen(v)}>
				<DialogContent className="sm:max-w-[480px]">
					<DialogHeader>
						<DialogTitle>近期在线情况</DialogTitle>
					</DialogHeader>
					<div className="flex justify-center overflow-x-auto">
						<ContributionGrid onlineDates={normalizedDates} />
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
