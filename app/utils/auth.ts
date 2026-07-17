import type { User } from '~/types/User';
import getProfile from '~/utils/requests/profile';
import logoutReq from '~/utils/requests/logout';

let cachedUser: User | null | undefined;
let pending: Promise<User | null> | undefined;

export const Auth = {
	async getUser() {
		if (cachedUser !== undefined) return cachedUser;
		if (pending) return pending;

		const promise = getProfile().then(result => {
			if (result.error) {
				cachedUser = null;
				return null;
			}
			cachedUser = result.data;
			return cachedUser;
		});
		pending = promise;

		const user = await promise;
		pending = undefined;
		return user;
	},
	async isLoggedIn() {
		const user = await this.getUser();
		return user !== null;
	},
	async logout() {
		const ok = await logoutReq();
		if (ok) cachedUser = null;
		return ok;
	},
	clearCache() {
		cachedUser = undefined;
		pending = undefined;
	}
};
