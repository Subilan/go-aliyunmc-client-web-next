import { useState, useEffect, useRef, useCallback } from 'react';
import * as React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '~/components/ui/hover-card';
import { Spinner } from '~/components/ui/spinner';
import type { LeaderboardEntry } from '~/utils/requests/game';
import { getLeaderboard } from '~/utils/requests/game';
import { getLeaderboardMock } from '~/utils/requests/game-mock';
import {
	formatDistanceCm,
	formatHearts,
	formatPlaytimeHours,
} from '~/components/game-statistics/stat-section';

type FormatType = 'distance' | 'time' | 'number' | 'hearts';

interface StatLeaderboardPopoverProps {
	metric: string;
	label: string;
	format: FormatType;
	children: React.ReactNode;
}

function formatLeaderboardValue(value: number, format: FormatType): string {
	switch (format) {
		case 'distance':
			return formatDistanceCm(value);
		case 'time':
			return formatPlaytimeHours(value, true);
		case 'hearts':
			return formatHearts(value);
		default:
			return value.toLocaleString();
	}
}

function LeaderboardRow({ entry, index, format, animate }: { entry: LeaderboardEntry; index: number; format: FormatType; animate: boolean }) {
	return (
		<div
			className="flex items-center gap-2 py-1.5 px-3"
			style={animate ? {
				animation: `leaderboard-row-in 0.25s ease-out both`,
				animationDelay: `${index * 55}ms`,
			} : undefined}
		>
			<img
				src={`https://minotar.net/helm/${entry.uuid}/24`}
				alt={entry.player_name}
				className="w-5 h-5 rounded-sm shrink-0"
				loading="lazy"
			/>
			<span className="flex-1 text-sm truncate">{entry.player_name}</span>
			<span className="text-sm font-medium tabular-nums shrink-0">
				{formatLeaderboardValue(entry.value, format)}
			</span>
		</div>
	);
}

export function StatLeaderboardPopover({ metric, label, format, children }: StatLeaderboardPopoverProps) {
	const [open, setOpen] = useState(false);
	const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
	const [loading, setLoading] = useState(false);
	const fetchedRef = useRef(false);
	const animatedRef = useRef(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const doFetch = useCallback(async () => {
		if (fetchedRef.current) return;
		setLoading(true);
		try {
			const fetcher = import.meta.env.DEV ? getLeaderboardMock : getLeaderboard;
			const res = await fetcher(metric);
			if (res.error === null && res.data) {
				setEntries(res.data);
			}
		} finally {
			setLoading(false);
			fetchedRef.current = true;
		}
	}, [metric]);

	useEffect(() => {
		if (open && !fetchedRef.current) {
			debounceRef.current = setTimeout(doFetch, 300);
		} else {
			clearTimeout(debounceRef.current);
		}
		return () => clearTimeout(debounceRef.current);
	}, [open, doFetch]);

	return (
		<HoverCard open={open} onOpenChange={setOpen} openDelay={0} closeDelay={100}>
			<HoverCardTrigger asChild>
				{children}
			</HoverCardTrigger>
			<HoverCardContent side="right" className="w-52 p-0">
				<div className="px-3 py-2 border-b text-xs font-medium text-muted-foreground">
					{label}排行
				</div>
				<div className="max-h-56 overflow-y-auto no-scrollbar">
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<Spinner className="text-muted-foreground" />
						</div>
					) : entries && entries.length > 0 ? (
						entries.map((entry, i) => {
							const animate = !animatedRef.current;
							if (i === entries.length - 1) animatedRef.current = true;
							return <LeaderboardRow key={entry.uuid} entry={entry} index={i} format={format} animate={animate} />;
						})
					) : (
						<div className="text-xs text-muted-foreground py-6 text-center">
							暂无排行数据
						</div>
					)}
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
