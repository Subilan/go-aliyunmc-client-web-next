import { post } from '~/utils/requests';

export default async function login(username: string, password: string, remember = false) {
	const result = await post('/user/login', {
		username,
		password,
		remember
	});

	return result.error === null;
}
