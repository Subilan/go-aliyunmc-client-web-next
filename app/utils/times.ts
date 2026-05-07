import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

export function formatFromNow(dateLike: Date | number | string) {
	const date = dayjs(dateLike);
	return date.fromNow();
}

export const Times = {
	formatFromNow,
	formatDuration
};

export function formatDuration(seconds: number): string {
	if (!seconds || seconds <= 0) return '—';
	const d = Math.floor(seconds / 86400);
	const h = Math.floor((seconds % 86400) / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	if (d > 0) return `${d}d ${h}h`;
	if (h > 0) return `${h}h ${m}m`;
	return `${m}m`;
}
