import { post } from '~/utils/requests';
import type { User } from '~/types/User';

export default async function register(username: string, password: string) {
	return post<User>('/user/register', {
		username,
		password
	});
}
