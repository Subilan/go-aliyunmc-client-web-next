import { useState, useMemo } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material';
import { XIcon } from 'lucide-react';

interface OnlineStatusSectionProps {
  onlineDates: string[];
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateDisplay(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function getLast7Days(): Date[] {
  const today = new Date();
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
}

// 数据最早有记录的日期，此日期之前的数据无效
const DATA_START_DATE = '2026-01-23';

const CELL = 14;

function ContributionGrid({ onlineDates }: { onlineDates: string[] }) {
  const onlineSet = useMemo(() => new Set(onlineDates), [onlineDates]);

  const { weeks, monthAtCol } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - 364);

    // Round start back to Sunday
    const startDay = start.getDay();
    start.setDate(start.getDate() - startDay);

    // Round end forward to Saturday
    const end = new Date(today);
    const endDay = end.getDay();
    if (endDay < 6) end.setDate(end.getDate() + (6 - endDay));

    const weeks: Date[][] = [];
    const current = new Date(start);
    while (current <= end) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }

    // Map column index → month label when a new month starts
    const monthAtCol: Record<number, string> = {};
    weeks.forEach((week, ci) => {
      const m = week[0].getMonth();
      if (ci === 0 || weeks[ci - 1][0].getMonth() !== m) {
        monthAtCol[ci] = `${m + 1}月`;
      }
    });

    return { weeks, monthAtCol };
  }, []);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-0.5 mr-1.5" style={{ paddingTop: 18 }}>
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="text-neutral-400 leading-none flex items-center"
              style={{ width: CELL, height: CELL, fontSize: 10 }}
            >
              {i % 2 === 0 ? label : ''}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex gap-0.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {/* Month label slot */}
              <div style={{ height: 18, width: CELL }} className="relative">
                {monthAtCol[wi] && (
                  <span
                    className="absolute text-xs text-neutral-500 whitespace-nowrap"
                    style={{ left: 0, top: 0 }}
                  >
                    {monthAtCol[wi]}
                  </span>
                )}
              </div>
              {week.map((day, di) => {
                const key = formatDateStr(day);
                const online = onlineSet.has(key);
                const isFuture = day > new Date();
                const isBeforeData = key < DATA_START_DATE;

                if (isBeforeData) {
                  return (
                    <div
                      key={di}
                      className="bg-neutral-100 border border-neutral-200"
                      style={{ width: CELL, height: CELL, borderRadius: 3 }}
                    />
                  );
                }

                const displayDate = formatDateDisplay(day);
                const status = isFuture ? '' : online ? ' 在线' : ' 不在线';
                return (
                  <Tooltip key={di} title={displayDate + status} arrow>
                    <div
                      className={`${isFuture ? 'bg-transparent' : online ? 'bg-green-500' : 'bg-neutral-200'}`}
                      style={{ width: CELL, height: CELL, borderRadius: 3 }}
                    />
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-xs text-neutral-500 justify-end">
        <span>无数据</span>
        <div className="bg-neutral-100 border border-neutral-200" style={{ width: CELL, height: CELL, borderRadius: 3 }} />
        <span>不在线</span>
        <div className="bg-neutral-200" style={{ width: CELL, height: CELL, borderRadius: 3 }} />
        <span>在线</span>
        <div className="bg-green-500" style={{ width: CELL, height: CELL, borderRadius: 3 }} />
      </div>
    </div>
  );
}

export function OnlineStatusSection({ onlineDates }: OnlineStatusSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const onlineSet = useMemo(() => new Set(onlineDates), [onlineDates]);
  const last7Days = useMemo(() => getLast7Days(), []);

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-neutral-400 tracking-wider">近7天在线情况</span>
        </div>
        <div className="flex gap-3 justify-between">
          {last7Days.map((d) => {
            const key = formatDateStr(d);
            const online = onlineSet.has(key);
            const dayLabel = `${d.getMonth() + 1}/${d.getDate()}`;
            const dayOfWeek = DAY_LABELS[d.getDay()];

            return (
              <div key={key} className="flex flex-col items-center gap-0.5">
                {online ? (
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-neutral-300" />
                )}
                <span className="text-xs text-neutral-500">{dayLabel}</span>
                {/* <span className="text-xs text-neutral-400">{dayOfWeek}</span> */}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end mt-2">
          <Button size="small" onClick={() => setDialogOpen(true)}>查看全部</Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          近365天在线情况
          <IconButton size="small" onClick={() => setDialogOpen(false)}>
            <XIcon size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <ContributionGrid onlineDates={onlineDates} />
        </DialogContent>
      </Dialog>
    </>
  );
}
