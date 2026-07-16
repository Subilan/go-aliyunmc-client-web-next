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

export default function PageHeader(props: {
	children: ReactNode;
	actions?: ReactNode;
	info?: ReactNode;
}) {
	const infoOpen = useStateNamed(false);

	return (
		<>
			<div className="flex items-center mb-6">
				<h1 className="text-3xl mr-2">{props.children}</h1>
				{props.info && (
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => infoOpen.set(true)}
					>
						<InfoIcon data-icon="inline-start" />
					</Button>
				)}
				<div className="flex-1" />
				{props.actions}
			</div>

			<Dialog open={infoOpen.current} onOpenChange={v => infoOpen.set(v)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{props.children}</DialogTitle>
					</DialogHeader>
					<div className="prose text-sm text-muted-foreground">{props.info}</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => infoOpen.set(false)}>
							关闭
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
