import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { Route } from './+types/player-list';
import {
	Card,
	CardActionArea,
	CardContent,
	CardMedia,
	FormControl,
	MenuItem,
	Select,
	Tooltip
} from '@mui/material';
import { AlertTriangleIcon, LockIcon } from 'lucide-react';
import PageHeader from '~/components/page-header';
import { PAGE_NAME_PLAYER_LIST } from '~/consts/page-names';
import { getPlayerList, type PlayerListEntry } from '~/utils/requests/game';
import EmptyState from '~/components/empty-state';
import { navigate } from '~/utils/navigate';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: PAGE_NAME_PLAYER_LIST + ' - Seatide' },
		{ name: 'description', content: '查看服务器所有玩家及其游戏统计信息。' }
	];
}

type SortOrder = 'asc' | 'desc';

function PlayerCard({ player }: { player: PlayerListEntry }) {
	const isPrivate = player.disallow_public_game_stats;

	const card = (
		<Card className={isPrivate ? 'opacity-60' : ''}>
			<CardActionArea
				onClick={() =>
					!isPrivate && navigate(`/game/statistics/${encodeURIComponent(player.uuid)}`)
				}
				disabled={isPrivate}
			>
				<div className="relative">
					<CardMedia
						component="img"
						image={`https://minotar.net/helm/${player.uuid}/128.png`}
						alt={player.name}
						className="aspect-square"
					/>
					{isPrivate && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/30">
							<LockIcon className="w-6 h-6 text-white" />
						</div>
					)}
				</div>
				<CardContent className="text-center !py-2">
					<div className="text-sm font-medium truncate">{player.name}</div>
				</CardContent>
			</CardActionArea>
		</Card>
	);

	if (isPrivate) {
		return <Tooltip title="该玩家隐藏了游戏统计信息">{card}</Tooltip>;
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
					<FormControl size="small">
						<Select
							value={sort}
							onChange={e => handleSortChange(e.target.value as SortOrder)}
						>
							<MenuItem value="asc">首字母 A-Z</MenuItem>
							<MenuItem value="desc">首字母 Z-A</MenuItem>
						</Select>
					</FormControl>
				}
			>
				{PAGE_NAME_PLAYER_LIST}
			</PageHeader>
			{loading ? (
				<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={i} className="aspect-square bg-neutral-100 rounded-xl animate-pulse" />
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
