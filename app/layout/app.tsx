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
import { Link, Outlet, redirect, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import MenuBtn from '~/components/menu-btn';
import { Auth } from '~/utils/auth';
import { UserContext } from '~/contexts/user';
import { PermissionsContext } from '~/contexts/permissions';
import useStateNamed from '~/hooks/useStateNamed';
import { Toast } from '~/root';
import { getPermissions } from '~/utils/requests/permissions';
import { McTranslationContext } from '~/contexts/mctranslations';
import { getMcTranslations } from '~/utils/requests/mc-translation';
import { getPageMeta } from '~/utils/page-meta';
import { createLoader } from '~/utils/createLoader';
import { navigate } from '~/utils/navigate';
import type { UserPermissions } from '~/types/UserPermissions';
import type { McTranslation } from '~/types/McTranslations';

export const appLoader = createLoader(async () => {
	const user = await Auth.getUser();
	if (!user) {
		throw redirect('/lor');
	}
	return { user };
});

const activeSx = {
	bgcolor: '#e3f2fd',
	fontWeight: 'bold',
	color: '#2196f3'
};

const inactiveSx = {
	fontWeight: 'normal'
};

export default function AppLayout() {
	const { user } = appLoader.get();
	const location = useLocation();
	const logoutOpen = useStateNamed(false);
	const loggingOut = useStateNamed(false);
	const [permissions, setPermissions] = useState<UserPermissions | null>(null);
	const [mctranslations, setMcTranslations] = useState<McTranslation | null>(null);

	useEffect(() => {
		Promise.all([
			getPermissions().then(setPermissions),
			getMcTranslations().then(setMcTranslations)
		]);
	}, []);

	function isActive(path: string) {
		return location.pathname === path;
	}

	const innerPageLabel = getPageMeta(location.pathname)?.label;

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
					<h1 className="text-xl leading-none mr-2 md:mr-6">TiLab</h1>
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
						{innerPageLabel && innerPageLabel !== '控制台' && (
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
