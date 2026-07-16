import { useState } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table';
import { CheckIcon, CpuIcon, RefreshCwIcon } from 'lucide-react';
import { Link } from 'react-router';
import { CardLabel } from '~/components/card-label';
import EmptyState, { LoadingEmptyState } from '~/components/empty-state';
import type { NamedBooleanState } from '~/hooks/useStateNamed';
import type { EcsCandidate } from '~/types/EcsCandidate';
import { getCandidates } from '~/utils/requests/instance';

export type EcsCandidatesFetchResult = Awaited<ReturnType<typeof getCandidates>>;

interface EcsCandidatesCardProps {
	candidates: EcsCandidate[];
	loading?: boolean;
	onRefreshData?: (result: EcsCandidatesFetchResult) => void;
}

export const EcsCandidates = {
	Card(props: EcsCandidatesCardProps) {
		const { candidates, loading = false, onRefreshData } = props;
		const [refreshing, setRefreshing] = useState(false);

		async function handleRefresh() {
			setRefreshing(true);
			try {
				const result = await EcsCandidates.fetchData();
				onRefreshData?.(result);
			} finally {
				setRefreshing(false);
			}
		}

		return (
			<Card>
				<CardContent>
					<CardLabel
						icon={<CpuIcon size={14} />}
						actions={
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-xs"
										disabled={refreshing}
										onClick={handleRefresh}
									>
										<RefreshCwIcon
											data-icon="inline-start"
											className={refreshing ? 'animate-spin' : ''}
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent>刷新</TooltipContent>
							</Tooltip>
						}
					>
						ECS 候选实例
					</CardLabel>
					{loading ? (
						<LoadingEmptyState />
					) : candidates.length === 0 ? (
						<EmptyState
							description={<span className="text-muted-foreground">暂无可用实例</span>}
							className="py-8"
						/>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="text-center">实例规格</TableHead>
									<TableHead className="text-center hidden md:table-cell">vCPU</TableHead>
									<TableHead className="text-center hidden md:table-cell">内存 (GiB)</TableHead>
									<TableHead className="text-center hidden md:table-cell">可用区</TableHead>
									<TableHead className="text-center">价格 (元/小时)</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{candidates.slice(0, 5).map((c, i) => (
									<TableRow key={i}>
										<TableCell className="text-center">
											<div className="flex justify-center items-center gap-2">
												{c.instanceType}
												{i === 0 && (
													<CheckIcon className="text-green-500 size-4" />
												)}
											</div>
										</TableCell>
										<TableCell className="text-center hidden md:table-cell">
											{c.cpuCoreCount}
										</TableCell>
										<TableCell className="text-center hidden md:table-cell">
											{c.memory}
										</TableCell>
										<TableCell className="text-center hidden md:table-cell">
											{c.zoneId}
										</TableCell>
										<TableCell className="text-center">
											¥{c.tradePrice.toFixed(2)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
					<div className="mt-2 text-right">
						<Button size="sm" variant="link" asChild>
							<Link to="/info/ecs-candidates">查看全部</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	},
	async fetchData(loading?: NamedBooleanState) {
		loading?.set(true);
		const res = await getCandidates();
		loading?.set(false);
		return res;
	}
};
