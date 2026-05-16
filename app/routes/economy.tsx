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
import type { BalanceChartPoint } from '~/components/balance-chart';
import { CardLabel } from '~/components/card-label';
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
	const [loading, setLoading] = useState(true);

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
		setLoading(false);
	}

	async function refresh() {
		setRefreshing(true);
		setLoading(true);
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
							value: !loading ? `¥${balance.current.toFixed(2)}` : null
						},
						{
							icon: <TrendingDownIcon size={12} />,
							label: '平均降低',
							value: loading
								? null
								: deductionRate.current === null
									? '—'
									: `¥${deductionRate.current.toFixed(2)}/h`
						},
						{
							icon: <ClockIcon size={12} />,
							label: '预计支撑时间',
							value: loading
								? null
								: estimatedHours === null
									? '—'
									: `${estimatedHours.toFixed(1)} h`
						}
					]}
				/>

				{/* balance history chart */}
				<Card variant="outlined">
					<CardContent>
						<CardLabel
							icon={<TrendingUpIcon size={14} />}
							actions={
								<Tooltip title="刷新">
									<IconButton
										size="small"
										disabled={refreshing}
										onClick={refresh}
									>
										<RefreshCwIcon
											size={16}
											className={refreshing ? 'animate-spin' : ''}
										/>
									</IconButton>
								</Tooltip>
							}
						>
							余额走势
						</CardLabel>
						<BalanceChart data={chartData.current} loading={loading} />
					</CardContent>
				</Card>
			</div>
		</>
	);
}
