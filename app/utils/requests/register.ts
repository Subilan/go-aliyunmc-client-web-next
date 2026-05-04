import { post } from '~/utils/requests';

export default async function register(username: string, password: string) {
	const result = await post('/user/register', {
		username,
		password
	});

	return result.error === null;
}
