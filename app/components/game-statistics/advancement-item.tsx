import type { AdvancementEntry } from '~/utils/requests/game';
import { useMcTranslate } from '~/hooks/useMcTranslate';
import { Times } from '~/utils/times';

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

export function AdvancementItem({ a, completed }: { a: AdvancementEntry; completed: boolean }) {
	const grayscaleClass = completed ? '' : 'grayscale';
	const hasProgress = Object.keys(a.criteria).length > 0;
	const translate = useMcTranslate();

	let background = '/advancement_icons/advbg-progress';
	if (a.isChallenge) background = '/advancement_icons/advbg-challenge';
	if (a.isGoal) background = '/advancement_icons/advbg-goal';
	if (completed) background += '-completed';
	background += '.png';

	return (
		<div className={`group/item relative cursor-default p-2 hover:z-20 flex justify-center`}>
			{/* Tooltip panel */}
			<div
				className="absolute top-[15px] left-[23%] z-10
				opacity-0 scale-95 group-hover/item:opacity-100 group-hover/item:scale-100
				transition-all duration-200 ease-out
				origin-top-left
				pointer-events-none group-hover/item:pointer-events-auto"
			>
				<div className="bg-black text-white rounded-lg shadow-lg shadow-neutral-600 border-2 border-neutral-300 min-w-[180px] overflow-hidden">
					{/* Title row — red bg, full width, icon height */}
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
					{/* Description — flush to left edge */}
					<div className="px-3 pt-3 pb-2 text-sm text-neutral-300 leading-relaxed">
						{a.chineseDescription}
					</div>
					{/* Criteria progress */}
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
			</div>

			{/* Icon with background frame */}
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
				{/* Blue dot: uncompleted but has progress */}
				{!completed && hasProgress && (
					<div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full z-20" />
				)}
			</div>
		</div>
	);
}
