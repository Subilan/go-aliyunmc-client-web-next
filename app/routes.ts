import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
	layout('layout/app.tsx', [
		index('routes/home.tsx'),
		layout('layout/inner-app.tsx', [
			route('/info/tasks', 'routes/info.tasks.tsx'),
			route('/info/ecs-candidates', 'routes/info.ecs-candidates.tsx')
		])
	]),
	route('/lor', 'routes/lor.tsx')
] satisfies RouteConfig;
