import { parseServerQuery, type ServerQueryApiResponse } from '~/types/ServerQuery';
import { get } from '~/utils/requests';

export async function queryServer() {
	const response = await get<ServerQueryApiResponse>('/server/query');

	if (response.error !== null) return { data: null, error: response.error };
	const raw = response.data?.data ?? response.data?.Data;
	if (!raw) {
		return { data: null, error: '服务器查询响应缺少数据' };
	}
	const players = response.data?.players ?? response.data?.Players ?? [];

	return {
		data: parseServerQuery(raw, players),
		error: null
	};
}
