import { post } from '~/utils/requests';

export default async function changePassword(oldPassword: string, newPassword: string) {
	return post('/user/change-password', {
		oldPassword,
		newPassword
	});
}
