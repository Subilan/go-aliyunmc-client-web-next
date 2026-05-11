import { IconButton, Tooltip } from '@mui/material';
import type { LucideIcon } from 'lucide-react';

export interface FuncListItem {
	name: string;
	action: () => void;
	icon: LucideIcon;
	disabled?: boolean;
}

export function FuncList(props: { items: FuncListItem[] }) {
	return (
		<div className="flex flex-wrap gap-1 border rounded-full border-neutral-100">
			{props.items.map((x, i) => {
				const Icon = x.icon;
				return (
					<Tooltip title={x.name} key={i}>
						<span>
							<IconButton
								size="small"
								disabled={x.disabled}
								onClick={() => x.action()}
							>
								<Icon size={16} />
							</IconButton>
						</span>
					</Tooltip>
				);
			})}
		</div>
	);
}
