import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import {
	ClockIcon,
	RefreshCwIcon,
	TrendingDownIcon,
	TrendingUpIcon
} from 'lucide-react';
import BalanceChart from '~/components/balance-chart';
import type { BalanceChartPoint } from '~/components/balance-chart';
import { getBalance, getAccountBalanceHistory } from '~/utils/requests/home';

export const EconomyCard = {
	Card() {
		const [balance, setBalance] = useState(0);
		const [chartData, setChartData] = useState<BalanceChartPoint[]>([]);
		const [deductionRate, setDeductionRate] = useState<number | null>(null);
		const [loading, setLoading] = useState(true);
		const [refreshing, setRefreshing] = useState(false);

		const fetchData = useCallback(async () => {
			const [balRes, chartRes] = await Promise.all([
				getBalance(),
				getAccountBalanceHistory()
			]);
			if (balRes.error === null) setBalance(balRes.data!);
			if (chartRes.error === null) {
				const raw = chartRes.data!;
				setChartData(
					raw.map(p => ({
						time: new Date(p.time).toLocaleString('zh-CN', {
							month: '2-digit',
							day: '2-digit',
							hour: '2-digit',
							minute: '2-digit'
						}),
						amount: p.amount
					}))
				);
				if (raw.length >= 2) {
					const sorted = [...raw].sort(
						(a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
					);
					let totalRate = 0;
					let count = 0;
					for (let i = 1; i < sorted.length; i++) {
						const deltaHr =
							(new Date(sorted[i].time).getTime() -
								new Date(sorted[i - 1].time).getTime()) /
							3600000;
						const deltaAmount = sorted[i - 1].amount - sorted[i].amount;
						if (deltaHr > 0 && deltaAmount > 0) {
							totalRate += deltaAmount / deltaHr;
							count++;
						}
					}
					setDeductionRate(count > 0 ? totalRate / count : null);
				}
			}
			setLoading(false);
		}, []);

		const handleRefresh = useCallback(async () => {
			setRefreshing(true);
			setLoading(true);
			try {
				await fetchData();
			} finally {
				setRefreshing(false);
			}
		}, [fetchData]);

		useEffect(() => {
			fetchData();
		}, [fetchData]);

		const estimatedHours = useMemo(() => {
			const effective = balance - 100;
			if (effective <= 0) return null;
			if (!deductionRate || deductionRate <= 0) return null;
			return Math.round((effective / deductionRate) * 10) / 10;
		}, [balance, deductionRate]);

		return (
			<Card>
				<CardContent>
					<div className="flex items-center justify-between mb-3">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							服务器经济
						</span>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-xs"
									disabled={refreshing}
									onClick={handleRefresh}
								>
									<RefreshCwIcon
										className={refreshing ? 'animate-spin' : ''}
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent>刷新</TooltipContent>
						</Tooltip>
					</div>

					<div className="grid grid-cols-3 gap-4 mb-4">
						<div>
							<div className="text-xs text-muted-foreground mb-1">当前余额</div>
							<div className="text-2xl font-bold">
								{loading ? '—' : `¥${balance.toFixed(2)}`}
							</div>
						</div>
						<div>
							<div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
								<TrendingDownIcon size={12} />
								平均降低
							</div>
							<div className="text-2xl font-bold">
								{loading ? '—' : deductionRate === null ? '—' : `¥${deductionRate.toFixed(2)}/h`}
							</div>
						</div>
						<div>
							<div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
								<ClockIcon size={12} />
								预计支撑时间
							</div>
							<div className="text-2xl font-bold">
								{loading ? '—' : estimatedHours === null ? '—' : `${estimatedHours.toFixed(1)} h`}
							</div>
						</div>
					</div>

					<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
						余额走势
					</div>
					<BalanceChart data={chartData} loading={loading} />
				</CardContent>
			</Card>
		);
	}
};
