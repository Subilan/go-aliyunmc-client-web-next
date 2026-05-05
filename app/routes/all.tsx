import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import {
	ClockIcon,
	CpuIcon,
	DollarSignIcon,
	LayoutDashboardIcon,
	ListTodoIcon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import type { Route } from './+types/all';
import { INFO_GROUP } from '~/utils/groups';

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

const groups: FeatureGroup[] = [
	{
		title: '控制台',
		cards: [
			{
				title: '控制台',
				description:
					'查看服务器状态、实例信息、ECS 候选列表及最近任务，执行实例与服务器管理操作。',
				to: '/',
				icon: LayoutDashboardIcon
			}
		]
	},
	{
		title: INFO_GROUP,
		cards: [
			{
				title: '任务列表',
				description:
					'查看所有已创建的任务，包括部署、备份、归档等操作的历史记录与运行状态。',
				to: '/info/tasks',
				icon: ListTodoIcon
			},
			{
				title: '候选实例',
				description:
					'浏览可用的 ECS 实例规格，比较不同配置的 vCPU、内存、价格及可用区信息。',
				to: '/info/ecs-candidates',
				icon: CpuIcon
			},
			{
				title: '服务器经济',
				description: '查看阿里云账户余额及历史走势，了解服务器运行账号的收支情况。',
				to: '/info/economy',
				icon: DollarSignIcon
			}
		]
	}
];

export function meta({}: Route.MetaArgs) {
	return [{ title: '所有功能 - Seatide' }];
}

export default function AllFeatures() {
	return (
		<>
			<h1 className="text-3xl mb-8">所有功能</h1>
			{groups.map(group => (
				<section key={group.title} className="mb-8">
					<h2 className="text-lg font-bold mb-4 text-neutral-500">{group.title}</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{group.cards.map(card => {
							const Icon = card.icon;
							return (
								<Card key={card.to} variant="outlined">
									<CardActionArea component={Link} to={card.to}>
										<CardContent>
											<div className="flex items-center gap-3 mb-2">
												<Icon size={24} className="text-blue-500" />
												<Typography variant="h6" component="div">
													{card.title}
												</Typography>
											</div>
											<Typography variant="body2" color="text.secondary">
												{card.description}
											</Typography>
										</CardContent>
									</CardActionArea>
								</Card>
							);
						})}
					</div>
				</section>
			))}
		</>
	);
}
