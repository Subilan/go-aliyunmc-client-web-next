import { createHashRouter } from 'react-router';
import AppLayout, { appLoader } from '~/layout/app';
import InnerAppLayout from '~/layout/inner-app';
import { ErrorBoundary } from '~/root';
import AllFeatures from '~/routes/all';
import Economy from '~/routes/economy';
import EcsCandidatesPage from '~/routes/ecs-candidates';
import GameStatistics, { gameStatisticsLoader } from '~/routes/game-statistics';
import Home from '~/routes/home';
import Leaderboard from '~/routes/leaderboard';
import Lor, { lorLoader } from '~/routes/lor';
import GameStatisticsPlayerList, { playerListLoader } from '~/routes/player-list';
import Profile from '~/routes/profile';
import TasksPage from '~/routes/tasks'; 
import Updates from '~/routes/updates';
import WebChat from '~/routes/web-chat';

export const router = createHashRouter([
	{
		path: '/',
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
						path: 'all',
						Component: AllFeatures
					},
					{
						Component: InnerAppLayout,
						children: [
							{
								path: 'info',
								children: [
									{
										path: 'tasks',
										Component: TasksPage
									},
									{
										path: 'ecs-candidates',
										Component: EcsCandidatesPage
									},
									{
										path: 'economy',
										Component: Economy
									}
								]
							},
							{
								path: 'game',
								children: [
									{
										path: 'player-list',
										Component: GameStatisticsPlayerList,
										loader: playerListLoader.itself
									},
									{
										path: 'statistics/:uuid',
										Component: GameStatistics,
										loader: gameStatisticsLoader.itself
									},
									{
										path: 'leaderboard',
										Component: Leaderboard
									},
									{
										path: 'web-chat',
										Component: WebChat
									}
								]
							},
							{
								path: 'updates',
								Component: Updates
							}
						]
					}
				]
			}
		]
	}
]);
