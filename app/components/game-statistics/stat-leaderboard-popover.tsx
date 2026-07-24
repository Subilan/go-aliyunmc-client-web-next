import { useState, useEffect, useRef, useCallback } from 'react';
import * as React from 'react';
import { motion } from 'framer-motion';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '~/components/ui/hover-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Spinner } from '~/components/ui/spinner';
import { Skeleton } from '~/components/ui/skeleton';
import { ChevronDownIcon } from 'lucide-react';
import type { LeaderboardEntry } from '~/utils/requests/game';
import { getStatLeaderboard } from '~/utils/requests/game';
import {
	formatDistanceCm,
	formatHearts,
	formatPlaytimeHours,
} from '~/components/game-statistics/stat-section';
import { useIsMobile } from '~/hooks/use-mobile';

type FormatType = 'distance' | 'time' | 'number' | 'hearts';

interface StatLeaderboardPopoverProps {
	metric: string;
	label: string;
	format: FormatType;
	playerUuid?: string;
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

const PODIUM_COLORS = [
	{ solid: '#DAA520', pale: 'rgba(218, 165, 32, 0.15)' },
	{ solid: '#4A90D9', pale: 'rgba(74, 144, 217, 0.15)' },
	{ solid: '#E0553D', pale: 'rgba(224, 85, 61, 0.15)' },
];

const containerVariants = {
	hidden: {},
	visible: {
		transition: { staggerChildren: 0.055 },
	},
};

const rowVariants = {
	hidden: { opacity: 0, y: 4 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.25 },
	},
};

function AvatarImg({ src, alt }: { src: string; alt: string }) {
	const [loaded, setLoaded] = useState(false);
	return (
		<>
			{!loaded && <Skeleton className="w-5 h-5 rounded-sm shrink-0" />}
			<img
				src={src}
				alt={alt}
				className={`w-5 h-5 rounded-sm shrink-0 ${loaded ? '' : 'hidden'}`}
				onLoad={() => setLoaded(true)}
			/>
		</>
	);
}

function LeaderboardRow({ entry, format, isSelf }: { entry: LeaderboardEntry; format: FormatType; isSelf?: boolean }) {
	return (
		<div className="flex items-center gap-2 py-1.5 px-3">
			<AvatarImg
				src={`https://minotar.net/helm/${entry.uuid}/24`}
				alt={entry.player_name}
			/>
			<span className={`flex-1 text-sm truncate ${isSelf ? 'font-bold' : ''}`}>{entry.player_name}</span>
			<span className={`text-sm tabular-nums shrink-0 ${isSelf ? 'font-bold' : 'font-medium'}`}>
				{formatLeaderboardValue(entry.value, format)}
			</span>
		</div>
	);
}

function LeaderboardContent({
	label,
	format,
	playerUuid,
	entries,
	loading,
	animatedRef,
	highlightPodium,
	setHighlightPodium,
}: {
	label: string;
	format: FormatType;
	playerUuid?: string;
	entries: LeaderboardEntry[] | null;
	loading: boolean;
	animatedRef: React.MutableRefObject<boolean>;
	highlightPodium: boolean;
	setHighlightPodium: (v: boolean) => void;
}) {
	const [scrolled, setScrolled] = useState(false);
	const [hasOverflow, setHasOverflow] = useState(false);
	const scrollRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!entries) return;
		const el = scrollRef.current;
		if (!el) return;
		requestAnimationFrame(() => {
			setHasOverflow(el.scrollHeight > el.clientHeight + 1);
		});
	}, [entries]);

	const handleScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		setScrolled(el.scrollTop > 1);
	}, []);

	return (
		<>
			<div className="px-3 py-2 border-b text-xs font-medium text-muted-foreground">
				{label}排行
			</div>
			<div className="relative">
				<div ref={scrollRef} onScroll={handleScroll} className="max-h-56 overflow-y-auto no-scrollbar">
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<Spinner className="text-muted-foreground" />
						</div>
					) : entries && entries.length > 0 ? (
						!animatedRef.current ? (
							<motion.div
								variants={containerVariants}
								initial="hidden"
								animate="visible"
								onAnimationStart={() => setHighlightPodium(true)}
							>
								{entries.map((entry, i) => {
									const pod = i < 3 ? PODIUM_COLORS[i] : null;
									return (
										<motion.div key={entry.uuid} variants={rowVariants}>
											{pod ? (
												<motion.div
													style={{
														borderLeft: '3px solid transparent',
														background: `linear-gradient(to right, ${pod.pale}, ${pod.pale}) no-repeat`,
														backgroundSize: '0% 100%',
													}}
													animate={highlightPodium ? {
														borderLeftColor: pod.solid,
														backgroundSize: '100% 100%',
														transition: {
															borderLeftColor: { duration: 0.06, delay: i * 0.055 + 0.25 },
															backgroundSize: { duration: 0.35, delay: i * 0.055 + 0.31, ease: [0.15, 0, 0.4, 1] },
														},
													} : undefined}
												>
													<LeaderboardRow entry={entry} format={format} isSelf={playerUuid === entry.uuid} />
												</motion.div>
											) : (
												<LeaderboardRow entry={entry} format={format} isSelf={playerUuid === entry.uuid} />
											)}
										</motion.div>
									);
								})}
							</motion.div>
						) : (
							entries.map((entry, i) => {
								const pod = i < 3 ? PODIUM_COLORS[i] : null;
								return (
									<div
										key={entry.uuid}
										style={pod ? {
											borderLeft: `3px solid ${pod.solid}`,
											background: `linear-gradient(to right, ${pod.pale}, ${pod.pale}) no-repeat`,
											backgroundSize: '100% 100%',
										} : undefined}
									>
										<LeaderboardRow entry={entry} format={format} isSelf={playerUuid === entry.uuid} />
									</div>
								);
							})
						)
					) : (
						<div className="text-xs text-muted-foreground py-6 text-center">
							暂无排行数据
						</div>
					)}
				</div>
				{hasOverflow && (
					<div className={`absolute bottom-0 left-0 right-0 flex justify-center pb-1 pt-4 bg-gradient-to-t from-white to-transparent pointer-events-none transition-opacity duration-300 ${scrolled ? 'opacity-0' : 'opacity-100'}`}>
						<ChevronDownIcon size={14} className="text-muted-foreground" />
					</div>
				)}
			</div>
		</>
	);
}

export function StatLeaderboardPopover({ metric, label, format, playerUuid, children }: StatLeaderboardPopoverProps) {
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);
	const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [highlightPodium, setHighlightPodium] = useState(false);
	const fetchedRef = useRef(false);
	const animatedRef = useRef(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const doFetch = useCallback(async () => {
		if (fetchedRef.current) return;
		setLoading(true);
		try {
			const res = await getStatLeaderboard(metric);
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

	useEffect(() => {
		if (open) return;
		setHighlightPodium(false);
		if (!animatedRef.current && entries !== null) {
			animatedRef.current = true;
		}
	}, [open, entries]);

	if (isMobile) {
		return (
			<>
				<div onClick={() => setOpen(true)} className="cursor-pointer">
					{children}
				</div>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogContent className="p-0 gap-0 sm:max-w-xs overflow-hidden" showCloseButton={false}>
						<DialogHeader className="sr-only">
							<DialogTitle>{label}排行</DialogTitle>
						</DialogHeader>
						<LeaderboardContent
							label={label}
							format={format}
							playerUuid={playerUuid}
							entries={entries}
							loading={loading}
							animatedRef={animatedRef}
							highlightPodium={highlightPodium}
							setHighlightPodium={setHighlightPodium}
						/>
					</DialogContent>
				</Dialog>
			</>
		);
	}

	return (
		<HoverCard open={open} onOpenChange={setOpen} openDelay={0} closeDelay={100}>
			<HoverCardTrigger asChild>
				<div onClick={() => setOpen(true)}>
					{children}
				</div>
			</HoverCardTrigger>
			<HoverCardContent side="right" className="w-52 p-0">
				<LeaderboardContent
					label={label}
					format={format}
					playerUuid={playerUuid}
					entries={entries}
					loading={loading}
					animatedRef={animatedRef}
					highlightPodium={highlightPodium}
					setHighlightPodium={setHighlightPodium}
				/>
			</HoverCardContent>
		</HoverCard>
	);
}
