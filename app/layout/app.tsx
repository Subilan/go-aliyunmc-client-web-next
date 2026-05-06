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

export async function clientLoader() {
	if (!(await Auth.isLoggedIn())) {
		throw redirect('/lor');
	}

	const [user, permissions] = await Promise.all([
		Auth.getUser(),
		getPermissions()
	]);

	return { user, permissions };
}

const activeSx = {
	bgcolor: 'rgba(255,255,255,0.15)',
	fontWeight: 'bold'
};

const inactiveSx = {
	fontWeight: 'normal'
};

export default function AppLayout({ loaderData }: Route.ComponentProps) {
	const { user, permissions } = loaderData;
	const navigate = useNavigate();
	const location = useLocation();
	const logoutOpen = useStateNamed(false);
	const loggingOut = useStateNamed(false);

	function isActive(path: string) {
		return location.pathname === path;
	}

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
					<div className="flex-1" />
					<MenuBtn
						icon={<UserCircle2Icon size={20} color="white" />}
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
			<main className="max-w-250 mx-auto py-10">
				<UserContext.Provider value={user}>
					<PermissionsContext.Provider value={permissions}>
						<Outlet />
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
