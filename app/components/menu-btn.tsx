import { Button, IconButton, Menu, type PopoverOrigin } from '@mui/material';
import type { LucideIcon } from 'lucide-react';
import React, { useCallback, type ReactNode } from 'react';
import useStateNamed from '~/hooks/useStateNamed';

export default function MenuBtn(props: {
	icon?: ReactNode;
	children?: ReactNode;
	items: (close: () => void) => ReactNode;
	vertical: PopoverOrigin['vertical'];
	horizontal: PopoverOrigin['horizontal'];
}) {
	const anchorEl = useStateNamed<HTMLElement | null>(null);

	const handleMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
		anchorEl.set(event.currentTarget);
	}, []);

	const handleClose = useCallback(() => anchorEl.set(null), []);

	const Icon = props.icon;

	return (
		<>
			{Icon && (
				<IconButton aria-haspopup="true" onClick={handleMenu}>
					{Icon}
				</IconButton>
			)}
			{!Icon && (
				<Button aria-haspopup="true" onClick={handleMenu}>
					{props.children}
				</Button>
			)}
			<Menu
				anchorEl={anchorEl.current}
				anchorOrigin={{
					vertical: props.vertical,
					horizontal: props.horizontal
				}}
				keepMounted
				transformOrigin={{
					vertical: props.vertical,
					horizontal: props.horizontal
				}}
				open={!!anchorEl.current}
				onClose={handleClose}
			>
				{props.items(handleClose)}
			</Menu>
		</>
	);
}
