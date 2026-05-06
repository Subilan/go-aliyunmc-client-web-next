import type { Model } from "./Model"

export interface User extends Model {
	username: string;
	role: '' | 'operator' | 'superuser';
	whitelist_uuid?: string;
}

export function isBasicUser(user: User) {
	return user.role === '';
}
