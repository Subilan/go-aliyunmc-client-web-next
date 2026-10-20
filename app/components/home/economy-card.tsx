import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { RefreshCwIcon } from 'lucide-react';
import BalanceChart from '~/components/balance-chart';
import type { BalanceChartPoint, BalanceChartPointRaw } from '~/components/balance-chart';
import {
	getBalance,
	getAccountBalanceHistory,
	getAccountBalanceStats
} from '~/utils/requests/home';
import type { AccountBalanceStats } from '~/utils/requests/home';

export const EconomyCard = {
	Card() {
		const [balance, setBalance] = useState(0);
		const [history, setHistory] = useState<BalanceChartPointRaw[]>([]);
		const [stats, setStats] = useState<AccountBalanceStats | null>(null);
		const [loading, setLoading] = useState(true);
		const [refreshing, setRefreshing] = useState(false);

		const fetchData = useCallback(async () => {
			const [balRes, chartRes, statsRes] = await Promise.all([
				getBalance(),
				getAccountBalanceHistory(),
				getAccountBalanceStats()
			]);
			if (balRes.error === null) setBalance(balRes.data!);
			if (chartRes.error === null) setHistory(chartRes.data!);
			if (statsRes.error === null) setStats(statsRes.data);
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

		const chartData = useMemo<BalanceChartPoint[]>(
			() =>
				history.map(p => ({
					time: new Date(p.time).toLocaleString('zh-CN', {
						month: '2-digit',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit'
					}),
					amount: p.amount
				})),
			[history]
		);

		const deductionRate = stats?.rate ?? null;

		const estimatedHours = useMemo(() => {
			const effective = balance - 100;
			if (effective <= 0) return null;
			if (!deductionRate || deductionRate <= 0) return null;
			return Math.round((effective / deductionRate) * 10) / 10;
		}, [balance, deductionRate]);

		return (
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="tracking-wider text-sm font-normal text-muted-foreground">服务器经济</CardTitle>
					<CardAction>
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
					</CardAction>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
						<div>
							<div className="text-xs text-muted-foreground mb-1">当前余额</div>
							<div className="text-2xl font-medium">
								{loading ? '—' : `¥${balance.toFixed(2)}`}
							</div>
						</div>
						<div>
							<div className="text-xs text-muted-foreground mb-1">
								平均降低
							</div>
							<div className="text-2xl font-medium">
								{loading ? (
									'—'
								) : deductionRate === null ? (
									stats ? (
										<Tooltip>
											<TooltipTrigger asChild>
												<span>—</span>
											</TooltipTrigger>
											<TooltipContent>
												{stats.has_enough_samples
													? '实例运行期间没有余额下降'
													: `运行样本不足：已累计 ${stats.running_hours.toFixed(1)} 小时，至少需要 ${stats.min_running_hours} 小时`}
											</TooltipContent>
										</Tooltip>
									) : (
										'—'
									)
								) : (
									`¥${deductionRate.toFixed(2)}/h`
								)}
							</div>
						</div>
						<div>
							<div className="text-xs text-muted-foreground mb-1">
								预计支撑时间
							</div>
							<div className="text-2xl font-medium">
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
