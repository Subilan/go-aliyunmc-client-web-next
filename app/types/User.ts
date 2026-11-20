import type { Model } from "./Model"

export interface User extends Model {
	username: string;
	role: '' | 'operator' | 'superuser';
	banned: boolean;
	whitelist_uuid?: string;
	last_login_at: string | null;
}

export function isBasicUser(user: User) {
	return user.role === '';
}
