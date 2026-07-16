import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import type { LucideIcon } from 'lucide-react';

export interface FuncListItem {
	name: string;
	action: () => void;
	icon: LucideIcon;
	disabled?: boolean;
}

export function FuncList(props: { items: FuncListItem[] }) {
	return (
		<div className="flex flex-wrap gap-1 border rounded-full">
			{props.items.map((x, i) => {
				const Icon = x.icon;
				return (
					<Tooltip key={i}>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								disabled={x.disabled}
								onClick={() => x.action()}
							>
								<Icon data-icon="inline-start" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{x.name}</TooltipContent>
					</Tooltip>
				);
			})}
		</div>
	);
}
