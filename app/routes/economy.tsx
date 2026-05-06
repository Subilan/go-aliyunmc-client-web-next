import { useEffect, useMemo, useState } from 'react';
import type { Route } from './+types/economy';
import { Card, CardContent, IconButton, Tooltip } from '@mui/material';
import {
	ClockIcon,
	DollarSignIcon,
	RefreshCwIcon,
	TrendingDownIcon,
	TrendingUpIcon
} from 'lucide-react';
import useStateNamed from '~/hooks/useStateNamed';
import BalanceChart from '~/components/balance-chart';
import type { BalanceChartPoint, BalanceChartPointRaw } from '~/components/balance-chart';
import MetricCard from '~/components/metric-card';
import { getBalance, getAccountBalanceHistory } from '~/utils/requests/home';
import { getCandidates } from '~/utils/requests/instance';
import PageHeader from '~/components/page-header';
import { PAGE_NAME_ECONOMY } from '~/consts/page-names';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: PAGE_NAME_ECONOMY + ' - Seatide' },
		{ name: 'description', content: '此页展示了服务器的经济收支情况。' }
	];
}

export default function Economy() {
	const balance = useStateNamed(0);
	const chartData = useStateNamed<BalanceChartPoint[]>([]);
	const bestPrice = useStateNamed<number | null>(null);
	const deductionRate = useStateNamed<number | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	async function fetchAll() {
		const [balRes, chartRes, candRes] = await Promise.all([
			getBalance(),
			getAccountBalanceHistory(),
			getCandidates()
		]);
		if (balRes.error === null) balance.set(balRes.data!);
		if (chartRes.error === null) {
			const raw = chartRes.data!;
			chartData.set(
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
			// compute average per-hour deduction rate (ignore increases from top-ups)
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
				deductionRate.set(count > 0 ? totalRate / count : null);
			}
		}
		if (candRes.error === null && candRes.data!.length > 0) {
			bestPrice.set(candRes.data![0].tradePrice);
		}
	}

	async function refresh() {
		setRefreshing(true);
		try {
			await fetchAll();
		} finally {
			setRefreshing(false);
		}
	}

	useEffect(() => {
		fetchAll();
	}, []);

	const estimatedHours = useMemo(() => {
		const effective = balance.current - 100;
		if (effective <= 0) return 0;
		if (!deductionRate.current || deductionRate.current <= 0) return 0;
		return Math.round((effective / deductionRate.current) * 10) / 10;
	}, [balance.current, deductionRate.current]);

	return (
		<>
			<PageHeader>{PAGE_NAME_ECONOMY}</PageHeader>
			<div className="flex flex-col gap-3">
				{/* overview */}
				<MetricCard
					cols={3}
					metrics={[
						{
							icon: <DollarSignIcon size={12} />,
							label: '当前余额',
							value: `¥${balance.current.toFixed(2)}`
						},
						{
							icon: <TrendingDownIcon size={12} />,
							label: '平均降低',
							value:
								deductionRate.current === null
									? '—'
									: `¥${deductionRate.current.toFixed(2)}/h`
						},
						{
							icon: <ClockIcon size={12} />,
							label: '预计支撑时间',
							value: estimatedHours === null ? '—' : `${estimatedHours.toFixed(1)} h`
						}
					]}
				/>

				{/* balance history chart */}
				<Card variant="outlined">
					<CardContent>
						<div className="tracking-wider text-sm mb-4 flex items-center gap-2">
							<TrendingUpIcon size={14} />
							余额走势 / BALANCE TREND
							<div className="flex-1" />
							<Tooltip title="刷新">
								<IconButton size="small" disabled={refreshing} onClick={refresh}>
									<RefreshCwIcon
										size={16}
										className={refreshing ? 'animate-spin' : ''}
									/>
								</IconButton>
							</Tooltip>
						</div>
						<BalanceChart data={chartData.current} />
					</CardContent>
				</Card>
			</div>
		</>
	);
}
