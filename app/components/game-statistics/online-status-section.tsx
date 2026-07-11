import { useState, useMemo } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material';
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

// 数据最早有记录的日期，此日期之前的数据无效
const DATA_START_DATE = '2026-05-12';

const LEGEND_CELL = 14;

function ContributionGrid({ onlineDates }: { onlineDates: string[] }) {
	const onlineSet = useMemo(() => new Set(onlineDates), [onlineDates]);

	const { weeks, monthAtCol } = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const start = new Date(today);
		start.setDate(today.getDate() - 60);

		// Round start back to Sunday
		const startDay = start.getDay();
		start.setDate(start.getDate() - startDay);

		// Round end forward to Saturday
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

		// Map column index → month label when a new month starts
		const monthAtCol: Record<number, string> = {};
		weeks.forEach((week, ci) => {
			const m = week[0].getMonth();
			if (ci === 0 || weeks[ci - 1][0].getMonth() !== m) {
				monthAtCol[ci] = `${m + 1}月`;
			}
		});

		return { weeks, monthAtCol };
	}, []);

	// Build flat arrays for CSS Grid: all days row-major, plus month headers
	const flatDays = weeks.flat();
	const colCount = weeks.length;

	return (
		<div className="w-[400px]">
			<div
				className="grid gap-[10px]"
				style={{
					gridTemplateColumns: `20px repeat(${colCount}, 1fr)`,
					gridTemplateRows: `18px repeat(7, auto)`
				}}
			>
				{/* Month header row: empty first cell, then month labels */}
				<div />
				{weeks.map((week, wi) => (
					<div key={`mh-${wi}`} className="relative overflow-visible">
						{monthAtCol[wi] && (
							<span className="absolute text-xs text-neutral-500 whitespace-nowrap left-0 top-0">
								{monthAtCol[wi]}
							</span>
						)}
					</div>
				))}

				{/* Day rows */}
				{[0, 1, 2, 3, 4, 5, 6].map(row => {
					const label = DAY_LABELS[row];
					return (
						<div key={`row-${row}`} className="contents">
							{/* Day-of-week label */}
							<div
								className="text-neutral-400 leading-none flex items-center"
								style={{ fontSize: 11 }}
							>
								{row % 2 === 0 ? label : ''}
							</div>
							{/* Cells for each column in this row */}
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
											className="bg-neutral-100 rounded-md border border-neutral-200"
											style={{ aspectRatio: '1' }}
										/>
									);
								}

								const displayDate = formatDateDisplay(day);
								const status = isFuture ? '' : online ? ' 在线' : ' 不在线';
								return (
									<Tooltip
										key={`${col}-${row}`}
										title={displayDate + status}
										arrow
									>
										<div
											className={`rounded-md ${isFuture ? 'bg-transparent' : online ? 'bg-green-500' : 'bg-neutral-200'}`}
											style={{ aspectRatio: '1' }}
										/>
									</Tooltip>
								);
							})}
						</div>
					);
				})}
			</div>
			<div className="flex items-center gap-2 mt-3 text-xs text-neutral-500 justify-end">
				<span>无数据</span>
				<div
					className="bg-neutral-100 border border-neutral-200"
					style={{ width: LEGEND_CELL, height: LEGEND_CELL, borderRadius: 3 }}
				/>
				<span>不在线</span>
				<div
					className="bg-neutral-200"
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

	// 后端返回的日期可能是 "2026-06-19T00:00:00+08:00"，统一截取 YYYY-MM-DD
	const normalizedDates = useMemo(() => onlineDates.map(d => d.slice(0, 10)), [onlineDates]);
	const onlineSet = useMemo(() => new Set(normalizedDates), [normalizedDates]);
	const last7Days = useMemo(() => getLast7Days(), []);

	return (
		<>
			<div>
				<div className="flex items-center justify-between mb-2">
					<span className="text-xs text-neutral-400 tracking-wider">近7天在线情况</span>
				</div>
				<div className="flex gap-3 justify-between">
					{last7Days.map(d => {
						const key = formatDateStr(d);
						const online = onlineSet.has(key);
						const dayLabel = `${d.getMonth() + 1}/${d.getDate()}`;
						const dayOfWeek = DAY_LABELS[d.getDay()];

						return (
							<div key={key} className="flex flex-col items-center gap-0.5">
								{online ? (
									<div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">
										✓
									</div>
								) : (
									<div className="w-8 h-8 rounded-full border-2 border-neutral-300" />
								)}
								<span className="text-xs text-neutral-500">{dayLabel}</span>
								{/* <span className="text-xs text-neutral-400">{dayOfWeek}</span> */}
							</div>
						);
					})}
				</div>
				<div className="flex justify-end mt-2">
					<Button size="small" onClick={() => setDialogOpen(true)}>
						查看全部
					</Button>
				</div>
			</div>

			<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
				<DialogTitle
					sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
				>
					近期在线情况
					<IconButton size="small" onClick={() => setDialogOpen(false)}>
						<XIcon size={18} />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<ContributionGrid onlineDates={normalizedDates} />
				</DialogContent>
			</Dialog>
		</>
	);
}
