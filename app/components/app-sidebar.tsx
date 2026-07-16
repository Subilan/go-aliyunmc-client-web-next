import { Link, useLocation, useNavigate } from 'react-router';
import {
	AlignEndHorizontalIcon,
	BarChart3Icon,
	ChevronLeftIcon,
	CpuIcon,
	DollarSignIcon,
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

const navItems = [
	{
		title: '控制台',
		url: '/',
		icon: LayoutDashboardIcon,
	},
];

const infoItems = [
	{ title: '任务列表', url: '/info/tasks', icon: ListTodoIcon },
	{ title: '候选实例', url: '/info/ecs-candidates', icon: CpuIcon },
	{ title: '经济', url: '/info/economy', icon: DollarSignIcon },
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
	const { state, toggleSidebar } = useSidebar();
	const [logoutOpen, setLogoutOpen] = useState(false);

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
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={toggleSidebar}
							tooltip={state === 'expanded' ? '收起侧边栏' : '展开侧边栏'}
						>
							{state === 'expanded' ? <ChevronLeftIcon /> : <PanelLeftIcon />}
							<span>Seatide</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						{navItems.map(item => (
							<SidebarMenuItem key={item.url}>
								<SidebarMenuButton
									asChild
									isActive={pathname === item.url}
									tooltip={item.title}
								>
									<Link to={item.url}>
										<item.icon />
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupLabel>信息</SidebarGroupLabel>
					<SidebarMenu>
						{infoItems.map(item => (
							<SidebarMenuItem key={item.url}>
								<SidebarMenuButton
									asChild
									isActive={pathname === item.url}
									tooltip={item.title}
								>
									<Link to={item.url}>
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
									<Link to={item.url}>
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
									tooltip="游戏统计"
								>
									<Link to={`/game/statistics/${user.whitelist_uuid}`}>
										<BarChart3Icon />
										<span>游戏统计</span>
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
									<Link to={item.url}>
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
							<Link to="/profile">
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
