import { InfoIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import useStateNamed from '~/hooks/useStateNamed';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { ScrollArea } from '~/components/ui/scroll-area';

export default function PageHeader(props: {
	children: ReactNode;
	actions?: ReactNode;
	info?: ReactNode;
}) {
	const infoOpen = useStateNamed(false);

	return (
		<>
			<div className="flex flex-wrap items-center gap-x-2 gap-y-3">
				<h1 className="text-3xl font-semibold whitespace-nowrap">{props.children}</h1>
				{props.info && (
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => infoOpen.set(true)}
					>
						<InfoIcon data-icon="inline-start" />
					</Button>
				)}
				{props.actions && (
					<div className="ml-auto flex flex-auto min-w-0 items-center justify-end">
						{props.actions}
					</div>
				)}
			</div>

			<Dialog open={infoOpen.current} onOpenChange={v => infoOpen.set(v)}>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>{props.children}</DialogTitle>
					</DialogHeader>
					<ScrollArea viewportClassName="max-h-[70vh]">
						<div className="prose text-base leading-relaxed text-muted-foreground pe-3">{props.info}</div>
					</ScrollArea>
					<DialogFooter>
						<Button variant="ghost" onClick={() => infoOpen.set(false)}>
							关闭
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
