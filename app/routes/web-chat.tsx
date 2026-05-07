import type { Route } from './+types/web-chat';
import PageHeader from '~/components/page-header';
import { PAGE_NAME_WEB_CHAT } from '~/consts/page-names';

export function meta({}: Route.MetaArgs) {
	return [{ title: PAGE_NAME_WEB_CHAT + ' - Seatide' }];
}

export default function WebChat() {
	return (
		<>
			<PageHeader>{PAGE_NAME_WEB_CHAT}</PageHeader>
		</>
	);
}
