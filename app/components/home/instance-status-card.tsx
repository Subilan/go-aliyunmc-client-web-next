import { Button, Card, CardContent } from '@mui/material';
import { HardDriveIcon } from 'lucide-react';
import { CardLabel } from '~/components/card-label';
import { FuncList, type FuncListItem } from '~/components/func-list';
import { instanceStatusColor, instanceStatusText } from '~/routes/home/utils';
import EmptyState from '~/components/empty-state';

interface InstanceStatusCardProps {
	notFound: boolean;
	busy: boolean;
	busyLabel: string;
	latestOutput: string | null;
	instanceStatus: string;
	instanceType: string;
	zoneId: string;
	ip: string;
	instanceActions: FuncListItem[];
	onCreateInstance: () => void;
}

export default function InstanceStatusCard(props: InstanceStatusCardProps) {
	const {
		notFound,
		busy,
		busyLabel,
		latestOutput,
		instanceStatus,
		instanceType,
		zoneId,
		ip,
		instanceActions,
		onCreateInstance
	} = props;

	return (
		<Card variant="outlined">
			<CardContent>
				<CardLabel icon={<HardDriveIcon size={14} />}>实例状态</CardLabel>
				{busy ? (
					<EmptyState
						spinner
						iconSize={40}
						iconClassName="text-neutral-300"
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
						className="py-8"
					/>
				) : notFound ? (
					<EmptyState
						icon={HardDriveIcon}
						iconSize={40}
						iconClassName="text-neutral-300"
						description={<span className="text-neutral-500">尚未创建实例</span>}
						action={
							<Button variant="contained" size="small" onClick={onCreateInstance}>
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
								<span className="text-xl font-bold">
									{instanceType || '—'}
								</span>
							</div>
							<div className="flex flex-col">
								<span className="text-xs text-neutral-400 mb-1">地域</span>
								<span className="text-xl font-bold">
									{zoneId || '—'}
								</span>
							</div>
							<div className="flex flex-col">
								<span className="text-xs text-neutral-400 mb-1">IP</span>
								<span className="text-xl font-bold">
									{ip || '—'}
								</span>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
