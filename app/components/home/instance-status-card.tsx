import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { HardDriveIcon, CopyIcon } from 'lucide-react';
import { instanceStatusColor, instanceStatusText } from '~/routes/home/utils';
import EmptyState, { LoadingEmptyState } from '~/components/empty-state';
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
	serverOnline: boolean;
	instanceType: string;
	zoneId: string;
	ip: string;
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
			serverOnline,
			instanceType,
			zoneId,
			ip
		} = props;

		const isRunning = instanceStatus === 'Running';
		const statusText = isRunning ? (serverOnline ? '在线' : '离线') : instanceStatusText(instanceStatus);
		const statusColor = isRunning ? (serverOnline ? 'bg-green-500' : 'bg-red-500') : instanceStatusColor(instanceStatus);

		return (
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="tracking-wider text-sm font-normal text-muted-foreground">实例</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<LoadingEmptyState />
					) : busy ? (
						<LoadingEmptyState
							description={
								<div className="flex flex-col items-center gap-1">
									<span className="text-muted-foreground">{busyLabel}</span>
									{latestOutput && (
										<span className="text-xs text-muted-foreground/70 font-mono max-w-md text-center truncate px-4">
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
							iconClassName="text-muted-foreground/30"
							description={<span className="text-muted-foreground">尚未创建实例</span>}
							className="py-8"
						/>
					) : (
						<div className="flex flex-col">
							<div className="flex items-center gap-2 mb-4">
								<div
									className={`w-2.5 h-2.5 rounded-full ${statusColor}`}
								/>
								<span className="text-xl font-bold">
									{statusText}
								</span>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="flex flex-col">
									<span className="text-xs text-muted-foreground">规格</span>
									<span className="text-sm font-medium truncate">{instanceType || '—'}</span>
								</div>
								<div className="flex flex-col">
									<span className="text-xs text-muted-foreground">地域</span>
									<span className="text-sm font-medium truncate">{zoneId || '—'}</span>
								</div>
								<div className="flex flex-col col-span-2">
									<span className="text-xs text-muted-foreground">IP 地址</span>
									<div className="flex items-center gap-1">
										<span className="text-sm font-medium font-mono">{ip || '—'}</span>
										{ip && (
											<Button
												variant="ghost"
												size="icon-xs"
												onClick={() => {
													navigator.clipboard.writeText(ip);
													Toast.success('已复制 IP 地址到剪贴板');
												}}
											>
												<CopyIcon />
											</Button>
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
