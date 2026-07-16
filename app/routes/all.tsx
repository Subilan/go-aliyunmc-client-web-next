import { Card } from '~/components/ui/card';
import {
	AlignEndHorizontalIcon,
	CpuIcon,
	DollarSignIcon,
	ListTodoIcon,
	LogsIcon,
	MessagesSquareIcon,
	UsersIcon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import type { MetaArgs } from 'react-router';
import PageHeader from '~/components/page-header';
import { PAGE_CATEGORY_GAME, PAGE_CATEGORY_INFORMATION, PAGE_CATEGORY_MISC } from "~/consts/page-categories";
import { PAGE_NAME_ECONOMY, PAGE_NAME_ECS_CANDIDATES, PAGE_NAME_LEADERBOARD, PAGE_NAME_PLAYER_LIST, PAGE_NAME_TASK_LIST, PAGE_NAME_UPDATES, PAGE_NAME_WEB_CHAT } from '~/consts/page-names';

interface FeatureCard {
	title: string;
	description: string;
	to: string;
	icon: LucideIcon;
}

interface FeatureGroup {
	title: string;
	cards: FeatureCard[];
}

export const groups: FeatureGroup[] = [
	{
		title: PAGE_CATEGORY_INFORMATION,
		cards: [
			{
				title: PAGE_NAME_TASK_LIST,
				description:
					'查看所有已创建的任务，包括部署、备份、归档等操作的历史记录与运行状态。',
				to: '/info/tasks',
				icon: ListTodoIcon
			},
			{
				title: PAGE_NAME_ECS_CANDIDATES,
				description:
					'浏览可用的 ECS 实例规格，比较不同配置的 vCPU、内存、价格及可用区信息。',
				to: '/info/ecs-candidates',
				icon: CpuIcon
			},
			{
				title: PAGE_NAME_ECONOMY,
				description: '查看阿里云账户余额及历史走势，了解服务器运行账号的收支情况。',
				to: '/info/economy',
				icon: DollarSignIcon
			}
		]
	},
	{
		title: PAGE_CATEGORY_GAME,
		cards: [
			{
				title: PAGE_NAME_PLAYER_LIST,
				description: '查看服务器已经获取白名单的玩家列表以及他们的个人统计数据。',
				to: '/game/player-list',
				icon: UsersIcon
			},
			{
				title: PAGE_NAME_LEADERBOARD,
				description: '浏览服务器玩家各项指标的排行榜，了解所有玩家的游戏数据。',
				to: '/game/leaderboard',
				icon: AlignEndHorizontalIcon
			},
			{
				title: PAGE_NAME_WEB_CHAT,
				description: '通过网页与游戏服务器内的玩家进行实时聊天交互。',
				to: '/game/web-chat',
				icon: MessagesSquareIcon
			}
		]
	},
	{
		title: PAGE_CATEGORY_MISC,
		cards: [
			{
				title: PAGE_NAME_UPDATES,
				description: '查看平台以及游戏的更新内容。',
				to: '/updates',
				icon: LogsIcon
			}
		]
	}
];



export function meta({}: MetaArgs) {
	return [{ title: '所有功能 - Seatide' }];
}

export default function AllFeatures() {
	return (
		<>
			<PageHeader>所有功能</PageHeader>
			{groups.map(group => (
				<section key={group.title} className="mb-8">
					<h2 className="text-lg mb-4 text-neutral-500">{group.title}</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{group.cards.map(card => {
							const Icon = card.icon;
							return (
								<Link to={card.to} key={card.to}>
								<Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full px-(--card-spacing) py-(--card-spacing)">
									<div>
										<div className="flex items-center gap-3 font-heading text-base leading-normal font-medium">
											<Icon size={24} className="text-primary shrink-0" />
											{card.title}
										</div>
										<div className="mt-3 text-sm text-muted-foreground">{card.description}</div>
									</div>
								</Card>
								</Link>
							);
						})}
					</div>
				</section>
			))}
		</>
	);
}
