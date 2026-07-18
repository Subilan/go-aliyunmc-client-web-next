import { Link, useLocation, useNavigate } from 'react-router';
import {
	AlignEndHorizontalIcon,
	BarChart3Icon,
	ChevronLeftIcon,
	CpuIcon,
	LayoutDashboardIcon,
	ListTodoIcon,
	LogOutIcon,
	LogsIcon,
	MessagesSquareIcon,
	PanelLeftIcon,
	UsersIcon,
	UserCircle2Icon
} from 'lucide-react';
import { useContext, useState } from 'react';
import { UserContext } from '~/contexts/user';
import { Auth } from '~/utils/auth';
import { Button } from '~/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '~/components/ui/sidebar';

const consoleItems = [
	{ title: '首页', url: '/', icon: LayoutDashboardIcon },
	{ title: '任务列表', url: '/info/tasks', icon: ListTodoIcon },
	{ title: '候选实例', url: '/info/ecs-candidates', icon: CpuIcon },
];

const gameItems = [
	{ title: '玩家列表', url: '/game/player-list', icon: UsersIcon },
	{ title: '排行榜', url: '/game/leaderboard', icon: AlignEndHorizontalIcon },
	{ title: 'Web 聊天', url: '/game/web-chat', icon: MessagesSquareIcon },
];

const miscItems = [
	{ title: '更新日志', url: '/updates', icon: LogsIcon },
];

export default function AppSidebar() {
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const user = useContext(UserContext);
	const { state, isMobile, setOpenMobile, toggleSidebar } = useSidebar();
	const [logoutOpen, setLogoutOpen] = useState(false);

	function handleNavClick() {
		if (isMobile) setOpenMobile(false);
	}

	async function handleLogout() {
		setLogoutOpen(false);
		const ok = await Auth.logout();
		if (ok) {
			navigate('/lor');
		}
	}

	return (
		<>
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<div className="flex items-center gap-2 px-2 py-1">
					<span className="text-xl font-recursive-casual tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">TiLab</span>
					<span className="hidden text-xl font-recursive-casual tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:inline">Ti</span>
				</div>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={toggleSidebar}
							tooltip={state === 'expanded' ? '收起侧边栏' : '展开侧边栏'}
						>
							{state === 'expanded' ? <ChevronLeftIcon /> : <PanelLeftIcon />}
							<span>收起</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>控制台</SidebarGroupLabel>
					<SidebarMenu>
						{consoleItems.map(item => (
							<SidebarMenuItem key={item.url}>
								<SidebarMenuButton
									asChild
									isActive={pathname === item.url}
									tooltip={item.title}
								>
							<Link to={item.url} onClick={handleNavClick}>
								<item.icon />
								<span>{item.title}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
		<SidebarGroup>
			<SidebarGroupLabel>游戏</SidebarGroupLabel>
			<SidebarMenu>
				{gameItems.map(item => (
					<SidebarMenuItem key={item.url}>
						<SidebarMenuButton
							asChild
							isActive={pathname === item.url}
							tooltip={item.title}
						>
							<Link to={item.url} onClick={handleNavClick}>
								<item.icon />
								<span>{item.title}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
				{user?.whitelist_uuid && (
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={pathname.startsWith('/game/statistics/')}
									tooltip="我的游戏统计"
								>
									<Link to={`/game/statistics/${user.whitelist_uuid}`} onClick={handleNavClick}>
										<BarChart3Icon />
										<span>我的游戏统计</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						)}
					</SidebarMenu>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupLabel>杂项</SidebarGroupLabel>
					<SidebarMenu>
						{miscItems.map(item => (
							<SidebarMenuItem key={item.url}>
								<SidebarMenuButton
									asChild
									isActive={pathname === item.url}
									tooltip={item.title}
								>
									<Link to={item.url} onClick={handleNavClick}>
										<item.icon />
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild tooltip="个人资料">
							<Link to="/profile" onClick={handleNavClick}>
								<UserCircle2Icon />
								<span>{user?.username ?? '用户'}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton onClick={() => setLogoutOpen(true)} tooltip="退出登录">
							<LogOutIcon />
							<span>退出登录</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>

		<Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>退出登录</DialogTitle>
					<DialogDescription>确定要退出登录吗？</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => setLogoutOpen(false)}>
						取消
					</Button>
					<Button variant="destructive" onClick={handleLogout}>
						确认
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
		</>
	);
}
