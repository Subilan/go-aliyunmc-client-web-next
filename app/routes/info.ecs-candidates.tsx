import { useEffect, useState } from 'react';
import {
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip
} from '@mui/material';
import type { EcsCandidate } from '~/types/EcsCandidate';
import { getCandidates } from '~/utils/requests/instance';

const columns = [
	{ id: 'instanceType', label: '实例规格', render: (c: EcsCandidate) => c.instanceType },
	{ id: 'cpuCoreCount', label: 'vCPU', render: (c: EcsCandidate) => c.cpuCoreCount, align: 'right' as const },
	{ id: 'memory', label: '内存 (GiB)', render: (c: EcsCandidate) => c.memory, align: 'right' as const },
	{ id: 'zoneId', label: '可用区', render: (c: EcsCandidate) => c.zoneId },
	{ id: 'tradePrice', label: '价格 (元/小时)', render: (c: EcsCandidate) => `¥${c.tradePrice.toFixed(2)}`, align: 'right' as const }
];

export default function EcsCandidatesPage() {
	const [candidates, setCandidates] = useState<EcsCandidate[]>([]);

	useEffect(() => {
		getCandidates().then(res => {
			if (res.error === null) setCandidates(res.data!);
		});
	}, []);

	return (
		<Paper variant="outlined">
			<TableContainer>
				<Table size="small">
					<TableHead>
						<TableRow>
							{columns.map(col => (
								<TableCell key={col.id} align={col.align ?? 'left'}>
									{col.label}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{candidates.map((c, i) => (
							<TableRow key={i} hover>
								<TableCell>
									<div className="flex items-center gap-2">
										<code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
											{c.instanceType}
										</code>
										{i === 0 && (
											<Chip label="最优" color="primary" size="small" />
										)}
									</div>
								</TableCell>
								<TableCell align="right">{c.cpuCoreCount}</TableCell>
								<TableCell align="right">{c.memory}</TableCell>
								<TableCell>{c.zoneId}</TableCell>
								<TableCell align="right">¥{c.tradePrice.toFixed(2)}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Paper>
	);
}
