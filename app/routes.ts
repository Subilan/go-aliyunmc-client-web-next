import { createHashRouter } from 'react-router';
import AppLayout, { appLoader } from '~/layout/app';
import RootLayout from '~/layout/root';
import { ErrorBoundary } from '~/root';
import EcsCandidatesPage from '~/routes/ecs-candidates';
import GameStatistics, { gameStatisticsLoader } from '~/routes/game-statistics';
import Home from '~/routes/home';
import Leaderboard from '~/routes/leaderboard';
import Lor, { lorLoader } from '~/routes/lor';
import GameStatisticsPlayerList from '~/routes/player-list';
import Profile from '~/routes/profile';
import TasksPage from '~/routes/tasks';
import Updates from '~/routes/updates';
import WebChat from '~/routes/web-chat';

export const router = createHashRouter([
	{
		path: '/',
		Component: RootLayout,
		ErrorBoundary: ErrorBoundary,
		children: [
			{
				path: 'lor',
				Component: Lor,
				loader: lorLoader.itself
			},
			{
				Component: AppLayout,
				loader: appLoader.itself,
				children: [
					{
						path: '',
						Component: Home,
						index: true
					},
					{
						path: 'profile',
						Component: Profile
					},
					{
						path: 'info/tasks',
						Component: TasksPage
					},
					{
						path: 'info/ecs-candidates',
						Component: EcsCandidatesPage
					},
					{
						path: 'game/player-list',
						Component: GameStatisticsPlayerList
					},
					{
						path: 'game/statistics/:uuid',
						Component: GameStatistics,
						loader: gameStatisticsLoader.itself
					},
					{
						path: 'game/leaderboard',
						Component: Leaderboard
					},
					{
						path: 'game/web-chat',
						Component: WebChat
					},
					{
						path: 'updates',
						Component: Updates
					}
				]
			}
		]
	}
]);
