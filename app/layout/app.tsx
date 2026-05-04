import { AppBar, IconButton, MenuItem, Toolbar } from '@mui/material';
import { MenuIcon, User2Icon, UserCircle2Icon } from 'lucide-react';
import { useRef } from 'react';
import { Outlet, redirect } from 'react-router';
import MenuBtn from '~/components/menu-btn';
import { Auth } from '~/utils/auth';
import type { Route } from './+types/app';
import { UserContext } from '~/contexts/user';

export async function clientLoader() {
	if (!(await Auth.isLoggedIn())) {
		throw redirect('/login');
	}

	return {
		user: await Auth.getUser()
	};
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
	const user = loaderData.user;

	return (
		<>
			<AppBar position="sticky">
				<Toolbar>
					<h1 className="text-xl leading-none">控制台</h1>
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
									}}
								>
									个人资料
								</MenuItem>
								<MenuItem
									onClick={() => {
										close();
									}}
								>
									偏好设置
								</MenuItem>
							</>
						)}
					/>
				</Toolbar>
			</AppBar>
			<main className="max-w-250 mx-auto py-10">
				<UserContext.Provider value={user}>
					<Outlet />
				</UserContext.Provider>
			</main>
		</>
	);
}
