import { get } from '~/utils/requests';

export default async function logout() {
	const result = await get('/user/logout');
	return result.error === null;
}
