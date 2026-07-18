import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { MetaArgs } from 'react-router';
import { Card } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { AlertTriangleIcon, LockIcon } from 'lucide-react';
import PageHeader from '~/components/page-header';
import { PAGE_NAME_PLAYER_LIST } from '~/consts/page-names';
import { getPlayerList, type PlayerListEntry } from '~/utils/requests/game';
import EmptyState from '~/components/empty-state';
import { navigate } from '~/utils/navigate';

export function meta({}: MetaArgs) {
	return [
		{ title: PAGE_NAME_PLAYER_LIST + ' - Seatide' },
		{ name: 'description', content: '查看服务器所有玩家及其游戏统计信息。' }
	];
}

type SortOrder = 'asc' | 'desc';

function PlayerCard({ player }: { player: PlayerListEntry }) {
	const isPrivate = player.disallow_public_game_stats;
	const [imageLoaded, setImageLoaded] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);

	useEffect(() => {
		if (imgRef.current?.complete) {
			setImageLoaded(true);
		}
	}, []);

	const card = (
		<Card className={(isPrivate ? 'opacity-60' : 'hover:bg-muted/50 transition-colors cursor-pointer') + ' pt-0 pb-0 gap-0'}>
			<div
				onClick={() =>
					!isPrivate && navigate(`/game/statistics/${encodeURIComponent(player.uuid)}`)
				}
				className="flex flex-col h-full"
			>
				<div className="relative aspect-square w-full rounded-t-xl overflow-hidden">
					<img
						ref={imgRef}
						src={`https://minotar.net/helm/${player.uuid}/128.png`}
						alt={player.name}
						className="w-full h-full object-cover"
						onLoad={() => setImageLoaded(true)}
					/>
					{!imageLoaded && (
						<div className="absolute inset-0 bg-muted animate-pulse" />
					)}
					{isPrivate && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/30">
							<LockIcon className="size-6 text-white" />
						</div>
					)}
				</div>
				<div className="flex-1 flex items-center justify-center text-center p-2">
					<div className="text-lg font-medium break-all leading-tight font-minecraft">{player.name}</div>
				</div>
			</div>
		</Card>
	);

	if (isPrivate) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<div>{card}</div>
				</TooltipTrigger>
				<TooltipContent>该玩家隐藏了游戏统计信息</TooltipContent>
			</Tooltip>
		);
	}

	return card;
}

export default function GameStatisticsPlayerList() {
	const [players, setPlayers] = useState<PlayerListEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchParams] = useSearchParams();
	const sort = (searchParams.get('sort') as SortOrder) || 'asc';
	const hideNoData = searchParams.get('hide_no_data') === 'true';

	useEffect(() => {
		getPlayerList().then(res => {
			if (res.data) setPlayers(res.data);
			setLoading(false);
		});
	}, []);

	const filteredPlayers = useMemo(() => {
		let result = [...players];
		if (hideNoData) {
			result = result.filter(p => p.has_data);
		}
		result.sort((a, b) => {
			const cmp = a.name.localeCompare(b.name, 'zh-Hans');
			return sort === 'asc' ? cmp : -cmp;
		});
		return result;
	}, [players, sort, hideNoData]);

	const updateSearchParam = useCallback((key: string, value: string | null) => {
		const params = new URLSearchParams(searchParams);
		if (value === null) {
			params.delete(key);
		} else {
			params.set(key, value);
		}
		navigate(`?${params.toString()}`, { replace: true });
	}, [searchParams]);

	const handleSortChange = (newSort: SortOrder) => {
		updateSearchParam('sort', newSort === 'asc' ? null : newSort);
	};

	const handleHideNoDataChange = (checked: boolean) => {
		updateSearchParam('hide_no_data', checked ? 'true' : null);
	};

	return (
		<>
			<PageHeader
				actions={
					<div className="flex items-center gap-3">
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="flex items-center gap-1.5">
									<Checkbox
										id="hide-no-data"
										checked={hideNoData}
										onCheckedChange={handleHideNoDataChange}
									/>
									<Label htmlFor="hide-no-data" className="text-sm cursor-pointer whitespace-nowrap font-normal">
										隐藏无数据的玩家
									</Label>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								隐藏当前无法获得游戏统计数据的玩家，这些玩家可能获得白名单后从未加入过服务器
							</TooltipContent>
						</Tooltip>
						<Select value={sort} onValueChange={v => handleSortChange(v as SortOrder)}>
							<SelectTrigger size="sm" className="w-[130px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="asc">首字母 A-Z</SelectItem>
									<SelectItem value="desc">首字母 Z-A</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				}
			>
				{PAGE_NAME_PLAYER_LIST}
			</PageHeader>
			{loading ? null : filteredPlayers.length ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-5">
					{filteredPlayers.map(p => (
						<PlayerCard key={p.uuid} player={p} />
					))}
				</div>
			) : (
				<EmptyState
					layout="horizontal"
					className="h-[30vh]"
					icon={AlertTriangleIcon}
					iconClassName="text-amber-500"
					description={players.length === 0 ? '请先绑定游戏账号' : '所有玩家暂无游戏数据'}
				/>
			)}
		</>
	);
}
