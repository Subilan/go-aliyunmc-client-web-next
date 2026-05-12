import { useNavigate, useSearchParams } from 'react-router';
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

export function meta({}: Route.MetaArgs) {
	return [
		{ title: PAGE_NAME_PLAYER_LIST + ' - Seatide' },
		{ name: 'description', content: '查看服务器所有玩家及其游戏统计信息。' }
	];
}

type SortOrder = 'asc' | 'desc';

interface LoaderData {
	players: PlayerListEntry[];
	sort: SortOrder;
}

export async function clientLoader({ request }: Route.ClientLoaderArgs): Promise<LoaderData> {
	const url = new URL(request.url);
	const sort = (url.searchParams.get('sort') as SortOrder) || 'asc';

	const res = await getPlayerList();
	const players = res.data ?? [];

	players.sort((a, b) => {
		const cmp = a.name.localeCompare(b.name, 'zh-Hans');
		return sort === 'asc' ? cmp : -cmp;
	});

	return { players, sort };
}

function PlayerCard({ player }: { player: PlayerListEntry }) {
	const navigate = useNavigate();
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

export default function GameStatisticsPlayerList({ loaderData }: Route.ComponentProps) {
	const { players, sort } = loaderData;
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

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
			{players.length ? (
				<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
					{players.map(p => (
						<PlayerCard key={p.uuid} player={p} />
					))}
				</div>
			) : (
				<div className="flex items-center justify-center h-[30vh]">
					<div className="flex items-center gap-2">
						<AlertTriangleIcon color='#ff9800'/>
						<p>请先绑定游戏账号</p>
					</div>
				</div>
			)}
		</>
	);
}
