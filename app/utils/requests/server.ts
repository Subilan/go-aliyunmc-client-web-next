import { parseServerQuery, type ServerQueryRaw } from '~/types/ServerQuery';
import { get } from '~/utils/requests';

export async function queryServer() {
	const { data, error } = await get<{ data: ServerQueryRaw; players: string[] }>('/server/query');

	if (error !== null) return { data, error };

	return { data: parseServerQuery(data.data), error: null };
}