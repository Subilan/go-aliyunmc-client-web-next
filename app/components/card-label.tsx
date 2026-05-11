import type { ReactNode } from 'react';

export function CardLabel(props: { icon?: ReactNode; actions?: ReactNode; children: ReactNode }) {
    return (
        <div className="tracking-wider text-sm mb-4 flex items-center gap-2">
            {props.icon}
            {props.children}
            {props.actions && (
                <>
                    <div className="flex-1" />
                    {props.actions}
                </>
            )}
        </div>
    );
}
