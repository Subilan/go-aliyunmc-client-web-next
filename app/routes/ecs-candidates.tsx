import { useEffect, useMemo } from 'react';
import {
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow} from '@mui/material';
import { CheckCircleIcon, CheckIcon, ClockIcon, ServerIcon } from 'lucide-react';
import type { EcsCandidate } from '~/types/EcsCandidate';
import { getCandidates } from '~/utils/requests/instance';
import MetricCard from '~/components/metric-card';
import PageHeader from '~/components/page-header';
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

export default function EcsCandidatesPage() {
	const candidates = useStateNamed<EcsCandidate[]>([]);
	const balance = useStateNamed(0);

	useEffect(() => {
		getCandidates().then(res => {
			if (res.error === null) candidates.set(res.data);
		});
		getBalance().then(res => {
			if (res.error === null) balance.set(res.data);
		});
	}, []);

	const estimatedHours = useMemo(() => {
		if (balance.current - 100 <= 0) return null;
		if (candidates.current.length === 0) return null;
		return ((balance.current - 100) / candidates.current[0].tradePrice).toFixed(1) + 'h';
	}, [balance.current, candidates]);

	return (
		<>
			<PageHeader>{PAGE_NAME_ECS_CANDIDATES}</PageHeader>
			<div className="flex flex-col gap-3">
				<MetricCard
					cols={3}
					metrics={[
						{
							icon: <CheckCircleIcon size={12} />,
							label: '最优规格',
							value: candidates.current[0]?.instanceType ?? '—'
						},
						{
							icon: <ServerIcon size={12} />,
							label: '符合要求的实例总数',
							value: candidates.current.length
						},
						{
							icon: <ClockIcon size={12} />,
							label: '预计支撑时间（偏高）',
							value: estimatedHours ?? '—'
						}
					]}
				/>

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
												{i === 0 && <CheckIcon size={16} color="green" />}
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
			</div>
		</>
	);
}
