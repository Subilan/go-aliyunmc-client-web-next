import type { Model } from "./Model"

export interface User extends Model {
	username: string;
	role: '' | 'operator' | 'superuser';
	banned: boolean;
	whitelist_uuid?: string;
}

export function isBasicUser(user: User) {
	return user.role === '';
}
