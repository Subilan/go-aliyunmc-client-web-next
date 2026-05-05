import { del } from '~/utils/requests';

export default async function deleteAccount() {
	return del('/user');
}
