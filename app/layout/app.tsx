import { AppBar, Button as MuiButton, MenuItem, Toolbar } from '@mui/material';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle
} from '@mui/material';
import { UserCircle2Icon } from 'lucide-react';
import { Link, Outlet, redirect, useLocation, useNavigate } from 'react-router';
import MenuBtn from '~/components/menu-btn';
import { Auth } from '~/utils/auth';
import type { Route } from './+types/app';
import { UserContext } from '~/contexts/user';
import { PermissionsContext } from '~/contexts/permissions';
import useStateNamed from '~/hooks/useStateNamed';
import { Toast } from '~/root';
import { getPermissions } from '~/utils/requests/permissions';
import { McTranslationContext } from '~/contexts/mctranslations';
import { getMcTranslations } from '~/utils/requests/mc-translation';
import {
	PAGE_NAME_ECONOMY,
	PAGE_NAME_ECS_CANDIDATES,
	PAGE_NAME_TASK_LIST,
	PAGE_NAME_PLAYER_LIST,
	PAGE_NAME_GAME_STATISTICS,
	PAGE_NAME_LEADERBOARD,
	PAGE_NAME_WEB_CHAT
} from '~/consts/page-names';

const pageMeta: Record<string, string> = {
	'/info/tasks': PAGE_NAME_TASK_LIST,
	'/info/ecs-candidates': PAGE_NAME_ECS_CANDIDATES,
	'/info/economy': PAGE_NAME_ECONOMY,
	'/game/player-list': PAGE_NAME_PLAYER_LIST,
	'/game/statistics/': PAGE_NAME_GAME_STATISTICS,
	'/game/leaderboard': PAGE_NAME_LEADERBOARD,
	'/game/web-chat': PAGE_NAME_WEB_CHAT
};

export async function clientLoader() {
	if (!(await Auth.isLoggedIn())) {
		throw redirect('/lor');
	}

	const [user, permissions, mctranslations] = await Promise.all([
		Auth.getUser(),
		getPermissions(),
		getMcTranslations()
	]);

	return { user, permissions, mctranslations };
}

const activeSx = {
	bgcolor: '#e3f2fd',
	fontWeight: 'bold',
	color: '#2196f3'
};

const inactiveSx = {
	fontWeight: 'normal'
};

export default function AppLayout({ loaderData }: Route.ComponentProps) {
	const { user, permissions, mctranslations } = loaderData;
	const navigate = useNavigate();
	const location = useLocation();
	const logoutOpen = useStateNamed(false);
	const loggingOut = useStateNamed(false);

	function isActive(path: string) {
		return location.pathname === path;
	}

	const innerPageLabel =
		pageMeta[location.pathname] ??
		Object.entries(pageMeta).find(
			([k]) => k.endsWith('/') && location.pathname.startsWith(k)
		)?.[1];

	async function handleLogout() {
		loggingOut.set(true);
		const ok = await Auth.logout();
		loggingOut.set(false);
		logoutOpen.set(false);
		if (ok) {
			navigate('/lor');
		} else {
			Toast.error('退出登录失败');
		}
	}

	return (
		<>
			<AppBar position="sticky">
				<Toolbar>
					<h1 className="text-xl leading-none mr-6">TiLab</h1>
					<div className="flex items-center gap-1">
						<MuiButton
							color="inherit"
							component={Link}
							to="/"
							sx={isActive('/') ? activeSx : inactiveSx}
						>
							首页
						</MuiButton>
						<MuiButton
							color="inherit"
							component={Link}
							to="/all"
							sx={isActive('/all') ? activeSx : inactiveSx}
						>
							所有功能
						</MuiButton>
						{innerPageLabel && (
							<MuiButton color="inherit" sx={activeSx}>
								{innerPageLabel}
							</MuiButton>
						)}
					</div>
					<div className="flex-1" />
					<MenuBtn
						icon={<UserCircle2Icon size={20} />}
						vertical={'top'}
						horizontal={'right'}
						items={close => (
							<>
								<MenuItem
									onClick={() => {
										close();
										navigate('/profile');
									}}
								>
									个人资料
								</MenuItem>
								{user?.whitelist_uuid && (
									<MenuItem
										onClick={() => {
											close();
											navigate('/game/statistics/' + user.whitelist_uuid);
										}}
									>
										游戏统计
									</MenuItem>
								)}
								<MenuItem
									onClick={() => {
										close();
										logoutOpen.set(true);
									}}
								>
									退出登录
								</MenuItem>
							</>
						)}
					/>
				</Toolbar>
			</AppBar>
			<main className="max-w-250 mx-5 md:mx-auto py-10">
				<UserContext.Provider value={user}>
					<PermissionsContext.Provider value={permissions}>
						<McTranslationContext.Provider value={mctranslations}>
							<Outlet />
						</McTranslationContext.Provider>
					</PermissionsContext.Provider>
				</UserContext.Provider>
			</main>

			<Dialog
				open={logoutOpen.current}
				onClose={() => logoutOpen.set(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>退出登录</DialogTitle>
				<DialogContent>
					<DialogContentText>确定要退出登录吗？</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => logoutOpen.set(false)} disabled={loggingOut.current}>
						取消
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={handleLogout}
						disabled={loggingOut.current}
					>
						{loggingOut.current ? '退出中...' : '确认'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
