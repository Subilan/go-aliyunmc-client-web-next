import { Button } from '~/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';
import type { ReactNode } from 'react';

export default function MenuBtn(props: {
	icon?: ReactNode;
	children?: ReactNode;
	triggerChildren?: ReactNode;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{props.icon ? (
					<Button variant="ghost" size="icon-sm">
						{props.icon}
					</Button>
				) : (
					<Button variant="outline">{props.triggerChildren}</Button>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					{props.children}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
