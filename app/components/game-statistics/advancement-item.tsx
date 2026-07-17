import type { AdvancementEntry } from '~/utils/requests/game';
import {
	Dialog,
	DialogContent
} from '~/components/ui/dialog';
import { useMcTranslate } from '~/hooks/useMcTranslate';
import { Times } from '~/utils/times';
import useStateNamed from '~/hooks/useStateNamed';
import { useEffect, useState } from 'react';

export const gifAdvancements = new Set([
	'minecraft:adventure/avoid_vibration',
	'minecraft:end/respawn_dragon',
	'minecraft:nether/summon_wither',
	'minecraft:story/enchant_item'
]);

export function advancementIconPath(resourceLocation: string): string {
	const ext = gifAdvancements.has(resourceLocation) ? 'gif' : 'png';
	const name = resourceLocation.replace('minecraft:', '').replace('/', '~');
	return `/advancement_icons/${name}.${ext}`;
}

function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia('(max-width: 767px)');
		setIsMobile(mq.matches);
		const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	}, []);
	return isMobile;
}

export function AdvancementItem({ a, completed }: { a: AdvancementEntry; completed: boolean }) {
	const grayscaleClass = completed ? '' : 'grayscale';
	const hasProgress = Object.keys(a.criteria).length > 0;
	const translate = useMcTranslate();
	const dialogOpen = useStateNamed(false);
	const isMobile = useIsMobile();

	let background = '/advancement_icons/advbg-progress';
	if (a.isChallenge) background = '/advancement_icons/advbg-challenge';
	if (a.isGoal) background = '/advancement_icons/advbg-goal';
	if (completed) background += '-completed';
	background += '.png';

	const tooltipContent = (
		<div className="bg-black text-white rounded-lg shadow-lg shadow-neutral-600 border-2 border-neutral-300 min-w-[180px] overflow-hidden">
			<div
				className="flex items-center h-[30px]"
				style={{
					backgroundColor: completed ? 'rgb(170, 126, 16)' : 'rgb(198,198,198)'
				}}
			>
				<div className="w-[48px] shrink-0" />
				<span className="font-bold whitespace-nowrap pr-3 pl-2 text-shadow-black text-shadow-2xs">
					{a.chineseName}
				</span>
			</div>
			<div className="px-3 pt-3 pb-2 text-sm text-neutral-300 leading-relaxed">
				{a.chineseDescription}
			</div>
			{hasProgress && (
				<div className="px-3 pb-2 text-xs text-neutral-400 border-t border-neutral-700 pt-2 space-y-0.5">
					<div className="text-neutral-300 mb-2">
						{completed ? '已完成的条件' : '进度'}
					</div>
					{Object.entries(a.criteria).map(([key, time]) => (
						<div key={key} className="truncate" title={time}>
							{translate(key)} — {Times.formatFromNow(time)}
						</div>
					))}
				</div>
			)}
		</div>
	);

	const dialogContent = (
		<div className="bg-black text-white rounded-lg shadow-lg shadow-neutral-600 border-2 border-neutral-300 min-w-[180px] overflow-hidden">
			<div
				className="flex items-center h-[30px]"
				style={{
					backgroundColor: completed ? 'rgb(170, 126, 16)' : 'rgb(198,198,198)'
				}}
			>
				<span className="font-bold whitespace-nowrap px-3 text-shadow-black text-shadow-2xs w-full text-center">
					{a.chineseName}
				</span>
			</div>
			<div className="px-3 pt-3 pb-2 text-sm text-neutral-300 leading-relaxed">
				{a.chineseDescription}
			</div>
			{hasProgress && (
				<div className="px-3 pb-2 text-xs text-neutral-400 border-t border-neutral-700 pt-2 space-y-0.5">
					<div className="text-neutral-300 mb-2">
						{completed ? '已完成的条件' : '进度'}
					</div>
					{Object.entries(a.criteria).map(([key, time]) => (
						<div key={key} className="truncate" title={time}>
							{translate(key)} — {Times.formatFromNow(time)}
						</div>
					))}
				</div>
			)}
		</div>
	);

	const iconElement = (
		<div className="relative z-10 w-[48px] h-[48px] flex items-center justify-center shrink-0">
			<img
				src={background}
				draggable={false}
				alt=""
				className="absolute inset-0 w-full h-full"
			/>
			<img
				draggable={false}
				src={advancementIconPath(a.resourceLocation)}
				alt={a.chineseName}
				className={`w-[30px] h-[30px] relative z-10 ${grayscaleClass}`}
				loading="lazy"
				style={{ imageRendering: 'pixelated' }}
			/>
			{!completed && hasProgress && (
				<div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full z-20" />
			)}
		</div>
	);

	return (
		<>
			<div
				className="group/item relative cursor-default p-2 md:hover:z-20 flex justify-center"
				onClick={() => {
					if (isMobile) dialogOpen.set(true);
				}}
			>
				<div className="relative">
					<div
						className="hidden md:block absolute top-[4px] left-[-7.5px] z-10
						opacity-0 scale-95 group-hover/item:opacity-100 group-hover/item:scale-100
						transition-all duration-200 ease-out
						origin-top-left
						pointer-events-none group-hover/item:pointer-events-auto"
					>
						{tooltipContent}
					</div>

					{iconElement}
				</div>
			</div>

			{isMobile && (
				<Dialog
					open={dialogOpen.current}
					onOpenChange={v => dialogOpen.set(v)}
				>
					<DialogContent
						showCloseButton={false}
						className="bg-transparent shadow-none border-0 p-0 sm:max-w-none max-w-none"
					>
						<div className="flex flex-col items-center gap-10 p-4">
							<div className="scale-[1.5]">
								{iconElement}
							</div>
							{dialogContent}
						</div>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
