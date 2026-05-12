import { Loader2Icon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
	layout?: 'horizontal' | 'vertical';
	icon?: LucideIcon;
	iconSize?: number;
	iconClassName?: string;
	spinner?: boolean;
	title?: string;
	description?: ReactNode;
	action?: ReactNode;
	className?: string;
}

export default function EmptyState({
	layout = 'vertical',
	icon: Icon,
	iconSize = 28,
	iconClassName,
	spinner = false,
	title,
	description,
	action,
	className = '',
}: EmptyStateProps) {
	const isHorizontal = layout === 'horizontal';

	const iconEl = spinner ? (
		<Loader2Icon size={iconSize} className={`animate-spin ${iconClassName ?? ''}`} />
	) : Icon ? (
		<Icon size={iconSize} className={iconClassName} />
	) : null;

	const hasText = title || description;

	const textBlock = hasText ? (
		<div className={`flex flex-col ${isHorizontal ? '' : 'text-center'}`}>
			{title && <span className="font-medium text-neutral-600">{title}</span>}
			{description && (typeof description === 'string' ? <span>{description}</span> : description)}
		</div>
	) : null;

	return (
		<div className={`flex flex-col items-center justify-center text-neutral-400 ${className}`}>
			<div className={`flex ${isHorizontal ? 'flex-row items-center' : 'flex-col items-center'} gap-2`}>
				{iconEl}
				{textBlock}
			</div>
			{action && <div className="mt-3">{action}</div>}
		</div>
	);
}
