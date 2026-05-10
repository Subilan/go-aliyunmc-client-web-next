import type { ReactNode } from 'react';
import { Card, CardContent, CircularProgress } from '@mui/material';

export interface MetricItem {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  loading?: boolean;
  subtitle?: ReactNode;
}

export default function MetricCard({
  title,
  metrics,
  cols = 3,
  className,
}: {
  title?: string;
  metrics: MetricItem[];
  cols?: number;
  className?: string;
}) {
  const colsClass =
    cols === 4
      ? 'grid-cols-2 md:grid-cols-4'
      : 'grid-cols-2 md:grid-cols-3';

  return (
    <Card variant="outlined" className={className}>
      <CardContent>
        {title && (
          <div className="tracking-wider text-sm mb-4">
            {title}
          </div>
        )}
        <div className={`grid gap-6 ${colsClass}`}>
          {metrics.map((m, i) => (
            <div key={i}>
              <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                {m.icon}
                {m.label}
              </div>
              <div className="text-3xl font-bold">
                {m.loading ? <CircularProgress size={24} /> : (m.value ?? '—')}
              </div>
              {m.subtitle && (
                <div className="text-xs text-neutral-400 mt-1">
                  {m.subtitle}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
