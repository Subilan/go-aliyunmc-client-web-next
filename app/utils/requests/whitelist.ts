import { post } from '~/utils/requests';

export async function bindWhitelist(name: string) {
	return post('/user/whitelist/bind', { name });
}

export async function unbindWhitelist() {
	return post('/user/whitelist/unbind', {});
}
