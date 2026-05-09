import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { Route } from './+types/player-list';
import { Card, CardActionArea, CardContent, CardMedia, Tooltip } from '@mui/material';
import { LockIcon } from 'lucide-react';
import PageHeader from '~/components/page-header';
import { PAGE_NAME_PLAYER_LIST } from '~/consts/page-names';
import { getPlayerList, type PlayerListEntry } from '~/utils/requests/game';
import useStateNamed from '~/hooks/useStateNamed';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: PAGE_NAME_PLAYER_LIST + ' - Seatide' },
		{ name: 'description', content: '查看服务器所有玩家及其游戏统计信息。' }
	];
}

function PlayerCard({ player }: { player: PlayerListEntry }) {
	const navigate = useNavigate();
	const isPrivate = player.disallow_public_game_stats;

	const card = (
		<Card className={isPrivate ? 'opacity-60' : ''}>
			<CardActionArea
				onClick={() => !isPrivate && navigate(`/game/statistics/${encodeURIComponent(player.uuid)}`)}
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
		return (
			<Tooltip title="该玩家隐藏了游戏统计信息">
				{card}
			</Tooltip>
		);
	}

	return card;
}

export default function GameStatisticsPlayerList() {
	const players = useStateNamed<PlayerListEntry[]>([]);
	const loading = useStateNamed(true);
	const error = useStateNamed<string | null>(null);

	useEffect(() => {
		getPlayerList().then(res => {
			loading.set(false);
			if (res.error === null) {
				players.set(res.data!);
			} else {
				error.set(typeof res.error === 'string' ? res.error : '获取玩家列表失败');
			}
		});
	}, []);

	return (
		<>
			<PageHeader>{PAGE_NAME_PLAYER_LIST}</PageHeader>
			{loading.current ? (
				<div className="text-neutral-400 text-sm">加载中...</div>
			) : error.current ? (
				<div className="text-neutral-400 text-sm">{error.current}</div>
			) : (
				<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
					{players.current.map(p => (
						<PlayerCard key={p.uuid} player={p} />
					))}
				</div>
			)}
		</>
	);
}
