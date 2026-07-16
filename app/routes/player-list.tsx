import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { MetaArgs } from 'react-router';
import { Card } from '~/components/ui/card';
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

	const card = (
		<Card className={(isPrivate ? 'opacity-60' : 'hover:bg-muted/50 transition-colors cursor-pointer') + ' pt-0 pb-1.5 gap-0'}>
			<div
				onClick={() =>
					!isPrivate && navigate(`/game/statistics/${encodeURIComponent(player.uuid)}`)
				}
			>
				<div className="relative">
					<img
						src={`https://minotar.net/helm/${player.uuid}/128.png`}
						alt={player.name}
						className="aspect-square w-full rounded-t-xl"
					/>
					{isPrivate && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-t-xl">
							<LockIcon className="size-6 text-white" />
						</div>
					)}
				</div>
				<div className="text-center px-2 py-1.5">
					<div className="text-base font-medium truncate">{player.name}</div>
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

	useEffect(() => {
		getPlayerList().then(res => {
			if (res.data) setPlayers(res.data);
			setLoading(false);
		});
	}, []);

	const sortedPlayers = useMemo(() => {
		const sorted = [...players];
		sorted.sort((a, b) => {
			const cmp = a.name.localeCompare(b.name, 'zh-Hans');
			return sort === 'asc' ? cmp : -cmp;
		});
		return sorted;
	}, [players, sort]);

	const handleSortChange = (newSort: SortOrder) => {
		const params = new URLSearchParams(searchParams);
		if (newSort === 'asc') {
			params.delete('sort');
		} else {
			params.set('sort', newSort);
		}
		navigate(`?${params.toString()}`, { replace: true });
	};

	return (
		<>
			<PageHeader
				actions={
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
				}
			>
				{PAGE_NAME_PLAYER_LIST}
			</PageHeader>
			{loading ? (
				<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
					))}
				</div>
			) : sortedPlayers.length ? (
				<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
					{sortedPlayers.map(p => (
						<PlayerCard key={p.uuid} player={p} />
					))}
				</div>
			) : (
				<EmptyState
					layout="horizontal"
					className="h-[30vh]"
					icon={AlertTriangleIcon}
					iconClassName="text-amber-500"
					description="请先绑定游戏账号"
				/>
			)}
		</>
	);
}
