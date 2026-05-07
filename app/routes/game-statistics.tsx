import { useContext, useEffect, useRef } from 'react';
import type { Route } from './+types/game-statistics';
import { Card, CardContent, Collapse, IconButton } from '@mui/material';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { SkinViewer } from 'skinview3d';
import PageHeader from '~/components/page-header';
import { PAGE_NAME_GAME_STATISTICS } from '~/consts/page-names';
import { getAdvancements, type AdvancementEntry } from '~/utils/requests/game';
import useStateNamed from '~/hooks/useStateNamed';
import { UserContext } from '~/contexts/user';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: PAGE_NAME_GAME_STATISTICS + ' - Seatide' },
		{ name: 'description', content: '查看玩家在游戏中的各种进度信息。' }
	];
}

function SkinModel(props: {uuid: string}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvasRef.current) return;
		const viewer = new SkinViewer({
			canvas: canvasRef.current,
			width: 180,
			height: 320,
			skin: `https://minotar.net/skin/${props.uuid}`,
		});
		viewer.autoRotate = true;
		return () => viewer.dispose();
	}, []);

	return <canvas ref={canvasRef} className="rounded-lg" />;
}

const gifAdvancements = new Set([
	'minecraft:adventure/avoid_vibration',
	'minecraft:end/respawn_dragon',
	'minecraft:nether/summon_wither',
	'minecraft:story/enchant_item',
]);

function advancementIconPath(resourceLocation: string): string {
	const ext = gifAdvancements.has(resourceLocation) ? 'gif' : 'png';
	const name = resourceLocation.replace('minecraft:', '').replace('/', '~');
	return `/advancement_icons/${name}.${ext}`;
}

function AchievementItem({ a, completed }: { a: AdvancementEntry; completed: boolean }) {
	const opacityClass = completed ? '' : 'opacity-50';
	const grayscaleClass = completed ? '' : 'grayscale';

	return (
		<div className={`group/item relative cursor-default p-2 ${opacityClass} hover:z-20`}>
			{/* Tooltip panel */}
			<div className="absolute top-2 left-2 z-10
				opacity-0 scale-95 group-hover/item:opacity-100 group-hover/item:scale-100
				transition-all duration-200 ease-out
				origin-top-left
				pointer-events-none group-hover/item:pointer-events-auto">
				<div className="bg-black text-white rounded-lg shadow-lg min-w-[180px] overflow-hidden">
					{/* Title row — red bg, full width, icon height */}
					<div className="flex items-center h-[48px] bg-[rgb(198,198,198)]">
						<div className="w-[48px] shrink-0" />
						<span className="font-bold whitespace-nowrap pr-3 pl-3 text-shadow-black text-shadow-2xs">
							{a.chineseName}
						</span>
					</div>
					{/* Description — flush to left edge */}
					<div className="px-3 pb-3 pt-2 text-sm text-neutral-300 leading-relaxed">
						{a.chineseDescription}
					</div>
				</div>
			</div>

			{/* Icon with background frame */}
			<div className="relative z-10 w-[48px] h-[48px] flex items-center justify-center shrink-0">
				<img
					src="/advancement_icons/advbg-progress.png"
					alt=""
					className="absolute inset-0 w-full h-full"
				/>
				<img
					src={advancementIconPath(a.resourceLocation)}
					alt={a.chineseName}
					className={`w-[30px] h-[30px] relative z-10 ${grayscaleClass}`}
					loading="lazy"
					style={{imageRendering: 'pixelated'}}
				/>
			</div>
		</div>
	);
}

export default function GameStatistics() {
	const user = useContext(UserContext);
	const advancements = useStateNamed<AdvancementEntry[]>([]);
	const showUncompleted = useStateNamed(false);

	useEffect(() => {
		getAdvancements().then(res => {
			if (res.error === null) advancements.set(res.data!);
		});
	}, []);

	const completed = advancements.current.filter(a => a.done);
	const uncompleted = advancements.current.filter(a => !a.done);

	return (
		<>
			<PageHeader>{PAGE_NAME_GAME_STATISTICS}</PageHeader>
			<div className="flex flex-col gap-3">
				{/* Player Overview */}
				<Card variant="outlined">
					<CardContent>
						<div className="tracking-wider text-sm mb-4">玩家概览 / PLAYER OVERVIEW</div>
						<div className="flex gap-6">
							<SkinModel uuid={user?.whitelist_uuid!} />
							<div className="flex-1 flex items-center justify-center text-neutral-400">
								暂无指标
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Advancements */}
				<Card variant="outlined">
					<CardContent sx={{ overflow: 'visible' }}>
						<div className="tracking-wider text-sm mb-4">成就 / ADVANCEMENTS</div>
						{advancements.current.length === 0 ? (
							<div className="text-neutral-400 text-sm">加载中...</div>
						) : (
							<>
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 overflow-visible">
									{completed.map(a => (
										<AchievementItem key={a.resourceLocation} a={a} completed />
									))}
								</div>

								{uncompleted.length > 0 && (
									<div className="mt-4">
										<div
											className="flex items-center gap-1 cursor-pointer select-none text-sm text-neutral-500"
											onClick={() => showUncompleted.set(!showUncompleted.current)}
										>
											<IconButton size="small">
												{showUncompleted.current ? (
													<ChevronDownIcon size={16} />
												) : (
													<ChevronRightIcon size={16} />
												)}
											</IconButton>
											未完成 ({uncompleted.length})
										</div>
										<Collapse in={showUncompleted.current}>
											<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-3 overflow-visible">
												{uncompleted.map(a => (
													<AchievementItem key={a.resourceLocation} a={a} completed={false} />
												))}
											</div>
										</Collapse>
									</div>
								)}
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</>
	);
}
