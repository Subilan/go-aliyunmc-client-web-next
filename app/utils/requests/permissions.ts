import { get } from '~/utils/requests';
import type { UserPermissions } from '~/types/UserPermissions';

let cached: UserPermissions | null = null;

export async function getPermissions(): Promise<UserPermissions | null> {
	if (cached) return cached;
	const { data } = await get<UserPermissions>('/user/permissions');
	if (data) cached = data;
	return data;
}
