export const BASE_URL = 'http://localhost:45678';

async function req<T = any>(
	url: string,
	options: RequestInit
): Promise<{ data: null; error: string } | { data: T; error: null }> {
	const result = await fetch(BASE_URL + url, {
		...options,
		credentials: 'include',
	});

	const json = await result.json();

	return result.status !== 200
		? {
				data: null,
				error: json.details
			}
		: {
				data: json.data,
				error: null
			};
}

/**
 * 向url发送一个GET请求
 * @param url
 * @param params 可选的查询参数，以对象形式传入
 * @returns 响应
 */
export function get<T = any>(url: string, params?: Record<string, string | number | undefined>) {
	let fullUrl = url;
	if (params) {
		const search = new URLSearchParams();
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined) search.set(k, String(v));
		}
		const qs = search.toString();
		if (qs) fullUrl += '?' + qs;
	}
	return req<T>(fullUrl, {
		method: 'get'
	});
}

/**
 * 向url发送一个请求体为body的POST请求。请求体类型固定为JSON
 * @param url 
 * @param body 
 * @returns 响应
 */
export function post<T = any>(url: string, body: Record<string, any>) {
	return req<T>(url, {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});
}

/**
 * 向url发送一个DELETE请求
 * @param url 
 * @returns 是否成功
 */
export async function del(url: string) {
	const result = await req(url, {
		method: 'delete'
	});

	return result.error === null;
}
