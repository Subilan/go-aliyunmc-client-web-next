import type { Route } from './+types/leaderboard';
import PageHeader from '~/components/page-header';
import { PAGE_NAME_LEADERBOARD } from '~/consts/page-names';

export function meta({}: Route.MetaArgs) {
	return [{ title: PAGE_NAME_LEADERBOARD + ' - Seatide' }];
}

export default function Leaderboard() {
	return (
		<>
			<PageHeader>{PAGE_NAME_LEADERBOARD}</PageHeader>
		</>
	);
}
