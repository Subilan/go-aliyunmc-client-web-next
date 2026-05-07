import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
	layout('layout/app.tsx', [
		index('routes/home.tsx'),
		route('/profile', 'routes/profile.tsx'),
		layout('layout/inner-app.tsx', [
			route('/info/tasks', 'routes/tasks.tsx'),
			route('/info/ecs-candidates', 'routes/ecs-candidates.tsx'),
			route('/info/economy', 'routes/economy.tsx'),
			route('/game/statistics', 'routes/game-statistics.tsx'),
			route('/game/leaderboard', 'routes/leaderboard.tsx'),
			route('/game/web-chat', 'routes/web-chat.tsx')
		]),
		route('/all', 'routes/all.tsx')
	]),
	route('/lor', 'routes/lor.tsx')
] satisfies RouteConfig;
