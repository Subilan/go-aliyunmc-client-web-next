import { useState } from 'react';
import {
	Button,
	Card,
	CardContent,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip
} from '@mui/material';
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
			<Card variant="outlined">
				<CardContent>
					<CardLabel
						icon={<CpuIcon size={14} />}
						actions={
							<Tooltip title="刷新">
								<IconButton size="small" disabled={refreshing} onClick={handleRefresh}>
									<RefreshCwIcon
										size={16}
										className={refreshing ? 'animate-spin' : ''}
									/>
								</IconButton>
							</Tooltip>
						}
					>
						ECS 候选实例
					</CardLabel>
					{loading ? (
						<LoadingEmptyState />
					) : candidates.length === 0 ? (
						<EmptyState
							description={<span className="text-neutral-500">暂无可用实例</span>}
							className="py-8"
						/>
					) : (
						<TableContainer component={Paper} variant="outlined">
							<Table size="small" sx={{ tableLayout: { xs: 'auto', md: 'fixed' } }}>
								<TableHead>
									<TableRow>
										<TableCell align="center">实例规格</TableCell>
										<TableCell
											align="center"
											sx={{ display: { xs: 'none', md: 'table-cell' } }}
										>
											vCPU
										</TableCell>
										<TableCell
											align="center"
											sx={{ display: { xs: 'none', md: 'table-cell' } }}
										>
											内存 (GiB)
										</TableCell>
										<TableCell
											align="center"
											sx={{ display: { xs: 'none', md: 'table-cell' } }}
										>
											可用区
										</TableCell>
										<TableCell align="center">价格 (元/小时)</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{candidates.slice(0, 5).map((c, i) => (
										<TableRow key={i} hover>
											<TableCell align="center">
												<div className="flex justify-center items-center gap-2">
													{c.instanceType}
													{i === 0 && (
														<CheckIcon color="green" size={16} />
													)}
												</div>
											</TableCell>
											<TableCell
												align="center"
												sx={{ display: { xs: 'none', md: 'table-cell' } }}
											>
												{c.cpuCoreCount}
											</TableCell>
											<TableCell
												align="center"
												sx={{ display: { xs: 'none', md: 'table-cell' } }}
											>
												{c.memory}
											</TableCell>
											<TableCell
												align="center"
												sx={{ display: { xs: 'none', md: 'table-cell' } }}
											>
												{c.zoneId}
											</TableCell>
											<TableCell align="center">
												¥{c.tradePrice.toFixed(2)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
					<div className="mt-2 text-right">
						<Button size="small" component={Link} to="/info/ecs-candidates">
							查看全部
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
