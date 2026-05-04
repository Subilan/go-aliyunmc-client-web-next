import type { User } from '~/types/User';
import { get } from '~/utils/requests';

export default async function getProfile() {
	return get<User>('/user/profile');
}
