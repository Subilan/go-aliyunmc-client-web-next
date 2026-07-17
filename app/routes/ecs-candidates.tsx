import { useEffect, useMemo, useState } from 'react';
import { CheckIcon, ClockIcon, AlertTriangleIcon } from 'lucide-react';
import type { EcsCandidate } from '~/types/EcsCandidate';
import { getCandidates } from '~/utils/requests/instance';
import PageHeader from '~/components/page-header';
import { getBalance } from '~/utils/requests/home';
import useStateNamed from '~/hooks/useStateNamed';
import { PAGE_NAME_ECS_CANDIDATES } from '~/consts/page-names';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';
import EmptyState from '~/components/empty-state';

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

function CandidateCard({
	candidate,
	isOptimal,
	className,
	estimatedHours
}: {
	candidate: EcsCandidate;
	isOptimal?: boolean;
	className?: string;
	estimatedHours?: string | null;
}) {
	return (
		<Card
			className={cn(
				className,
				isOptimal && 'ring-2 ring-emerald-500/50'
			)}
		>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="font-mono text-base">
						{candidate.instanceType}
					</CardTitle>
					{isOptimal && (
						<Badge className="gap-1 bg-emerald-500 hover:bg-emerald-500 text-white">
							<CheckIcon className="size-3" />
							最优规格
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{isOptimal && estimatedHours !== undefined && (
					<div className="flex items-center gap-1.5 mb-3 px-3 py-2 bg-muted/50 rounded-md text-sm">
						<ClockIcon size={13} className="text-muted-foreground shrink-0" />
						<span className="text-muted-foreground">预计支撑时间（偏高）</span>
						<span className="font-semibold">{estimatedHours ?? '—'}</span>
					</div>
				)}
				<div
					className={cn(
						'grid gap-x-4 gap-y-2 text-sm',
						isOptimal ? 'grid-cols-4' : 'grid-cols-2'
					)}
				>
					<SpecItem label="vCPU" value={candidate.cpuCoreCount} />
					<SpecItem label="内存" value={`${candidate.memory} GiB`} />
					<SpecItem label="可用区" value={candidate.zoneId} />
					<SpecItem label="价格" value={`¥${candidate.tradePrice.toFixed(2)}/小时`} />
				</div>
			</CardContent>
		</Card>
	);
}

function SpecItem({ label, value }: { label: string; value: string | number }) {
	return (
		<div>
			<span className="text-xs text-muted-foreground">{label}</span>
			<p className="font-medium">{value}</p>
		</div>
	);
}

function SkeletonCard({ className, isOptimal }: { className?: string; isOptimal?: boolean }) {
	return (
		<Card
			className={cn(
				className,
				isOptimal && 'ring-2 ring-emerald-500/50'
			)}
		>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<div className="h-5 bg-muted rounded animate-pulse w-36" />
					{isOptimal && (
						<div className="h-5 bg-muted rounded-full animate-pulse w-20" />
					)}
				</div>
			</CardHeader>
			<CardContent>
				{isOptimal && (
					<div className="flex items-center gap-1.5 mb-3 px-3 py-2 bg-muted/50 rounded-md">
						<div className="h-4 bg-muted rounded animate-pulse w-36" />
					</div>
				)}
				<div
					className={cn(
						'grid gap-x-4 gap-y-2',
						isOptimal ? 'grid-cols-4' : 'grid-cols-2'
					)}
				>
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i}>
							<div className="h-3 bg-muted rounded animate-pulse w-10 mb-1.5" />
							<div className="h-4 bg-muted rounded animate-pulse w-16" />
						</div>
					))}
				</div>
			</CardContent>
		</Card>
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

	const estimatedHours = useMemo(() => {
		if (balance.current - 100 <= 0) return null;
		if (candidates.current.length === 0) return null;
		return ((balance.current - 100) / candidates.current[0].tradePrice).toFixed(1) + 'h';
	}, [balance.current, candidates]);

	return (
		<>
			<PageHeader info={Info()}>{PAGE_NAME_ECS_CANDIDATES}</PageHeader>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
				{loading ? (
					<>
						<SkeletonCard isOptimal className="md:col-span-2" />
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
					</>
				) : candidates.current.length === 0 ? (
					<div className="col-span-full">
						<EmptyState
							icon={AlertTriangleIcon}
							iconClassName="text-amber-500"
							description="暂无可用实例"
						/>
					</div>
				) : (
					candidates.current.map((c, i) => (
						<CandidateCard
							key={c.instanceType}
							candidate={c}
							isOptimal={i === 0}
							className={i === 0 ? 'md:col-span-2' : ''}
							estimatedHours={i === 0 ? estimatedHours : undefined}
						/>
					))
				)}
			</div>
		</>
	);
}
