import { useEffect, useState } from 'react';
import { AlertTriangleIcon } from 'lucide-react';
import type { EcsCandidate } from '~/types/EcsCandidate';
import { getCandidates } from '~/utils/requests/instance';
import PageHeader from '~/components/page-header';
import { getBalance } from '~/utils/requests/home';
import useStateNamed from '~/hooks/useStateNamed';
import { PAGE_NAME_ECS_CANDIDATES } from '~/consts/page-names';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';
import EmptyState from '~/components/empty-state';

const COLUMN_COUNT = 6;

function Info() {
	return (
		<>
			<p>
				<strong>候选实例</strong>是指经过控制台选择的那些满足 Minecraft
				服务器运行要求的实例，我们对这些实例有 vCPU 数量以及内存上的要求。
			</p>
			<p>
				对于满足条件的实例，我们从中选择价格最低的那一个作为下一次开启服务器时使用的实例，这就是
				<strong>"最优规格"</strong>。
			</p>
			<p>
				<strong>预计支撑时间</strong>
				等于当前服务器账户余额除以最优规格的小时价格，这是一个偏高的估值，实际可支撑的开服时间会因为一些额外的收费项目（例如下行流量）以及实例本身波动的价格而有所降低。
			</p>
		</>
	);
}

function SkeletonRow() {
	return (
		<TableRow>
			<TableCell>
				<div className="h-4 w-32 bg-muted rounded animate-pulse" />
			</TableCell>
			<TableCell>
				<div className="h-4 w-8 bg-muted rounded animate-pulse ml-auto" />
			</TableCell>
			<TableCell>
				<div className="h-4 w-12 bg-muted rounded animate-pulse ml-auto" />
			</TableCell>
			<TableCell>
				<div className="h-4 w-20 bg-muted rounded animate-pulse" />
			</TableCell>
			<TableCell>
				<div className="h-4 w-20 bg-muted rounded animate-pulse ml-auto" />
			</TableCell>
			<TableCell className="hidden md:table-cell">
				<div className="h-4 w-16 bg-muted rounded animate-pulse ml-auto" />
			</TableCell>
		</TableRow>
	);
}

export default function EcsCandidatesPage() {
	const candidates = useStateNamed<EcsCandidate[]>([]);
	const balance = useStateNamed(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([
			getCandidates().then(res => {
				if (res.error === null) candidates.set(res.data);
			}),
			getBalance().then(res => {
				if (res.error === null) balance.set(res.data);
			})
		]).finally(() => setLoading(false));
	}, []);

	const availableBalance = balance.current - 100;

	function estimateHours(candidate: EcsCandidate) {
		if (availableBalance <= 0) return null;
		return (availableBalance / candidate.tradePrice).toFixed(1) + 'h';
	}

	return (
		<>
			<PageHeader info={Info()}>{PAGE_NAME_ECS_CANDIDATES}</PageHeader>
			<div className="border rounded-lg bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>实例规格</TableHead>
							<TableHead className="text-right">vCPU</TableHead>
							<TableHead className="text-right">内存</TableHead>
							<TableHead>可用区</TableHead>
							<TableHead className="text-right">价格</TableHead>
							<TableHead className="hidden md:table-cell text-right">预计支撑时间</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={`skel-${i}`} />)
						) : candidates.current.length === 0 ? (
							<TableRow>
								<TableCell colSpan={COLUMN_COUNT}>
									<EmptyState
										icon={AlertTriangleIcon}
										iconClassName="text-amber-500"
										description="暂无可用实例"
										className="py-10"
									/>
								</TableCell>
							</TableRow>
						) : (
							candidates.current.map((c, i) => {
								const isOptimal = i === 0;
								return (
									<TableRow
										key={c.instanceType + '-' + c.zoneId}
										className={cn(isOptimal && 'bg-emerald-500/5 hover:bg-emerald-500/10')}
									>
										<TableCell>
											<div className="flex items-center gap-2">
												<span className="font-mono font-medium">{c.instanceType}</span>
												{isOptimal && (
													<Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">
														当前
													</Badge>
												)}
											</div>
										</TableCell>
										<TableCell className="text-right">{c.cpuCoreCount}</TableCell>
										<TableCell className="text-right">{c.memory} GiB</TableCell>
										<TableCell>{c.zoneId}</TableCell>
										<TableCell className="text-right font-mono">
											¥{c.tradePrice.toFixed(2)}
											<span className="text-muted-foreground font-sans">/小时</span>
										</TableCell>
										<TableCell className="hidden md:table-cell text-right">
											<span className={cn(isOptimal && 'font-semibold')}>
												{estimateHours(c) ?? '—'}
											</span>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>
		</>
	);
}
