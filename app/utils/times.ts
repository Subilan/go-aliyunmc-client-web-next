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
	formatFromNow
};
