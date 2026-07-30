import { get, post, type Resp } from '~/utils/requests';
import type { User } from '~/types/User';

export interface ListUsersParams {
	banned?: string;
	username?: string;
	limit: number;
	offset: number;
	sort?: string;
	order?: string;
}

export interface ListUsersResponse {
	users: User[];
	total: number;
}

export interface BanResponse {
	affected_count: number;
	not_found_ids?: number[];
	not_found_usernames?: string[];
	skipped_self?: boolean;
}

export function listUsers(params: ListUsersParams): Promise<Resp<ListUsersResponse>> {
	const searchParams = new URLSearchParams();
	if (params.banned) searchParams.set('banned', params.banned);
	if (params.username) searchParams.set('username', params.username);
	searchParams.set('limit', String(params.limit));
	searchParams.set('offset', String(params.offset));
	if (params.sort) searchParams.set('sort', params.sort);
	if (params.order) searchParams.set('order', params.order);
	return get<ListUsersResponse>(`/user/s?${searchParams.toString()}`);
}

export function banUser(body: { user_ids?: number[]; usernames?: string[] }): Promise<Resp<BanResponse>> {
	return post<BanResponse>('/user/ban', body);
}

export function unbanUser(body: { user_ids?: number[]; usernames?: string[] }): Promise<Resp<BanResponse>> {
	return post<BanResponse>('/user/unban', body);
}
