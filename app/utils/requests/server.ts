import { parseServerQuery, type ServerQueryRaw } from '~/types/ServerQuery';
import { get } from '~/utils/requests';

export async function queryServer() {
	const response = await get<{ data: Partial<ServerQueryRaw>; players: string[] }>('/server/query');

	if (response.error !== null) return { data: null, error: response.error };
	if (!response.data?.data) {
		return { data: null, error: '服务器查询响应缺少数据' };
	}

	return { data: parseServerQuery(response.data.data), error: null };
}
