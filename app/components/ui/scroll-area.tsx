import * as React from 'react';
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui';

import { cn } from '~/lib/utils';

/**
 * Overlay scroll area.
 *
 * The native scrollbar is removed entirely, so the container keeps its full
 * width; Radix renders a floating thumb instead. With the default `type="hover"`
 * the thumb only appears while the pointer is over the area (or while its
 * pointer hovers over the rendered thumb), and disappears otherwise.
 *
 * Hiding happens immediately on pointer leave (`scrollHideDelay = 0`) and is
 * animated by the scrollbar's opacity transition; `forceMount` keeps the
 * scrollbar mounted while the content overflows so the fade-out can play.
 *
 * Put sizing on `className` when the root should fill a parent; put
 * `max-h-*`-style constraints on `viewportClassName` since the viewport is the
 * element that actually scrolls.
 */
function ScrollArea({
	className,
	viewportClassName,
	viewportRef,
	children,
	type = 'hover',
	scrollHideDelay = 0,
	...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
	viewportClassName?: string;
	viewportRef?: React.Ref<HTMLDivElement>;
}) {
	return (
		<ScrollAreaPrimitive.Root
			data-slot="scroll-area"
			type={type}
			scrollHideDelay={scrollHideDelay}
			className={cn('relative', className)}
			{...props}
		>
			<ScrollAreaPrimitive.Viewport
				ref={viewportRef}
				data-slot="scroll-area-viewport"
				className={cn(
					'h-full w-full rounded-[inherit] outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
					viewportClassName
				)}
			>
				{children}
			</ScrollAreaPrimitive.Viewport>
			<ScrollBar />
			<ScrollAreaPrimitive.Corner />
		</ScrollAreaPrimitive.Root>
	);
}

function ScrollBar({
	className,
	orientation = 'vertical',
	...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Scrollbar>) {
	return (
		<ScrollAreaPrimitive.Scrollbar
			data-slot="scroll-area-scrollbar"
			orientation={orientation}
			forceMount
			className={cn(
				'flex touch-none select-none p-px opacity-100 transition-opacity duration-200 ease-out',
				'data-[state=hidden]:pointer-events-none data-[state=hidden]:opacity-0',
				orientation === 'vertical' && 'h-full w-1.5',
				orientation === 'horizontal' && 'h-1.5 flex-col',
				className
			)}
			{...props}
		>
			<ScrollAreaPrimitive.Thumb
				data-slot="scroll-area-thumb"
				className="relative flex-1 rounded-full bg-foreground/25 hover:bg-foreground/40"
			/>
		</ScrollAreaPrimitive.Scrollbar>
	);
}

export { ScrollArea, ScrollBar };
