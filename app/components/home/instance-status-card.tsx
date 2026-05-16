import { Button, Card, CardContent, IconButton } from '@mui/material';
import { CopyIcon, HardDriveIcon } from 'lucide-react';
import { CardLabel } from '~/components/card-label';
import { FuncList, type FuncListItem } from '~/components/func-list';
import { instanceStatusColor, instanceStatusText } from '~/routes/home/utils';
import EmptyState, { LoadingEmptyState } from '~/components/empty-state';
import { useContext } from 'react';
import { UserContext } from '~/contexts/user';
import { Toast } from '~/root';
import type { NamedBooleanState } from '~/hooks/useStateNamed';
import { getActiveInstance } from '~/utils/requests/instance';
import { getInstanceStatus } from '~/utils/requests/state';

interface InstanceStatusCardProps {
	notFound: boolean;
	busy: boolean;
	loading?: boolean;
	busyLabel: string;
	latestOutput: string | null;
	instanceStatus: string;
	instanceType: string;
	zoneId: string;
	ip: string;
	instanceActions: FuncListItem[];
	onCreateInstance: () => void;
}

export const InstanceStatus = {
	Card(props: InstanceStatusCardProps) {
		const {
			notFound,
			busy,
			loading = false,
			busyLabel,
			latestOutput,
			instanceStatus,
			instanceType,
			zoneId,
			ip,
			instanceActions,
			onCreateInstance
		} = props;
		const user = useContext(UserContext);

		return (
			<Card variant="outlined">
				<CardContent>
					<CardLabel icon={<HardDriveIcon size={14} />}>实例状态</CardLabel>
					{loading ? (
						<LoadingEmptyState />
					) : busy ? (
						<LoadingEmptyState
							description={
								<div className="flex flex-col items-center gap-1">
									<span className="text-neutral-500">{busyLabel}</span>
									{latestOutput && (
										<span className="text-xs text-neutral-400 font-mono max-w-md text-center truncate px-4">
											{latestOutput}
										</span>
									)}
								</div>
							}
						/>
					) : notFound ? (
						<EmptyState
							icon={HardDriveIcon}
							iconSize={40}
							iconClassName="text-neutral-300"
							description={<span className="text-neutral-500">尚未创建实例</span>}
							action={
								<Button
									disabled={!user?.whitelist_uuid}
									variant="contained"
									size="small"
									onClick={onCreateInstance}
								>
									创建实例
								</Button>
							}
							className="py-8"
						/>
					) : (
						<div className="flex flex-col items-start md:flex-row gap-4">
							<div className="flex flex-col gap-3">
								<div className="flex items-center gap-2">
									<div
										className={`w-2.5 h-2.5 rounded-full ${instanceStatusColor(instanceStatus)}`}
									/>
									<span className="text-xl font-bold">
										{instanceStatusText(instanceStatus)}
									</span>
								</div>
								<FuncList items={instanceActions} />
							</div>
							<div className="flex-1" />
							<div className="md:w-1/2 flex-col gap-4 md:flex-row grow md:justify-around flex md:gap-8">
								<div className="flex flex-col">
									<span className="text-xs text-neutral-400 mb-1">规格</span>
									<span className="text-xl font-bold">{instanceType || '—'}</span>
								</div>
								<div className="flex flex-col">
									<span className="text-xs text-neutral-400 mb-1">地域</span>
									<span className="text-xl font-bold">{zoneId || '—'}</span>
								</div>
								<div className="flex flex-col">
									<span className="text-xs text-neutral-400 mb-1">IP</span>
									<div className="flex items-center gap-1">
										<span className="text-xl font-bold">{ip || '—'}</span>
										{ip && (
											<IconButton
												onClick={() => {
													navigator.clipboard.writeText(ip);
													Toast.success('已复制 IP 地址到剪贴板');
												}}
											>
												<CopyIcon size={16} />
											</IconButton>
										)}
									</div>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		);
	},
	async fetchData(loading?: NamedBooleanState) {
		loading?.set(true);
		const res = await Promise.all([getActiveInstance(), getInstanceStatus()]);
		loading?.set(false);
		return res;
	}
};
