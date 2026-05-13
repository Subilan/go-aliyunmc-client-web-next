import { useEffect, useMemo, useState } from 'react';
import {
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow
} from '@mui/material';
import { CheckCircleIcon, CheckIcon, ClockIcon, ServerIcon } from 'lucide-react';
import type { EcsCandidate } from '~/types/EcsCandidate';
import { getCandidates } from '~/utils/requests/instance';
import MetricCard from '~/components/metric-card';
import PageHeader from '~/components/page-header';
import EmptyState, { LoadingEmptyState } from '~/components/empty-state';
import { getBalance } from '~/utils/requests/home';
import useStateNamed from '~/hooks/useStateNamed';
import { PAGE_NAME_ECS_CANDIDATES } from '~/consts/page-names';

const columns = [
	{
		id: 'instanceType',
		label: '实例规格',
		render: (c: EcsCandidate) => c.instanceType
	},
	{
		id: 'cpuCoreCount',
		label: 'vCPU',
		render: (c: EcsCandidate) => c.cpuCoreCount
	},
	{ id: 'memory', label: '内存 (GiB)', render: (c: EcsCandidate) => c.memory },
	{ id: 'zoneId', label: '可用区', render: (c: EcsCandidate) => c.zoneId },
	{
		id: 'tradePrice',
		label: '价格 (元/小时)',
		render: (c: EcsCandidate) => `¥${c.tradePrice.toFixed(2)}`
	}
];

function Info() {
	return (
		<>
			<p>
				<strong>候选实例</strong>是指经过控制台选择的那些满足 Minecraft
				服务器运行要求的实例，我们对这些实例有 vCPU 数量以及内存上的要求。
			</p>
			<p>对于满足条件的实例，我们从中选择价格最低的那一个作为下一次开启服务器时使用的实例，这就是<strong>“最优规格”</strong>。</p>
			<p>
				<strong>预计支撑时间</strong>等于当前服务器账户余额除以最优规格的小时价格，这是一个偏高的估值，实际可支撑的开服时间会因为一些额外的收费项目（例如下行流量）以及实例本身波动的价格而有所降低。
			</p>
		</>
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
			<div className="flex flex-col gap-3">
				<MetricCard
					cols={3}
					metrics={[
						{
							icon: <CheckCircleIcon size={12} />,
							label: '最优规格',
							value: candidates.current[0]?.instanceType ?? null,
							loading
						},
						{
							icon: <ServerIcon size={12} />,
							label: '符合要求的实例总数',
							value: !loading ? candidates.current.length : null,
							loading
						},
						{
							icon: <ClockIcon size={12} />,
							label: '预计支撑时间（偏高）',
							value: !loading ? (estimatedHours ?? '—') : null,
							loading
						}
					]}
				/>

				{loading ? (
					<Paper variant="outlined">
						<LoadingEmptyState />
					</Paper>
				) : candidates.current.length === 0 ? (
					<Paper variant="outlined">
						<EmptyState
							description={<span className="text-neutral-500">暂无可用实例</span>}
							className="py-8"
						/>
					</Paper>
				) : (
					<Paper variant="outlined">
						<TableContainer>
							<Table size="small">
								<TableHead>
									<TableRow>
										{columns.map(col => (
											<TableCell key={col.id} align="center">
												{col.label}
											</TableCell>
										))}
									</TableRow>
								</TableHead>
								<TableBody>
									{candidates.current.map((c, i) => (
										<TableRow key={i} hover>
											<TableCell align="center">
												<div className="flex justify-center items-center gap-2">
													{c.instanceType}{' '}
													{i === 0 && (
														<CheckIcon size={16} color="green" />
													)}
												</div>
											</TableCell>
											<TableCell align="center">{c.cpuCoreCount}</TableCell>
											<TableCell align="center">{c.memory}</TableCell>
											<TableCell align="center">{c.zoneId}</TableCell>
											<TableCell align="center">
												¥{c.tradePrice.toFixed(2)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					</Paper>
				)}
			</div>
		</>
	);
}
