import { router } from "~/routes";
import { navigate } from "~/utils/navigate";

// export const BASE_URL = 'http://localhost:45678'
export const BASE_URL = '/api';

export type Resp<T = any> =
	| { data: null; error: string; status: number }
	| { data: T; error: null; status: number };

async function req<T = any>(url: string, options: RequestInit): Promise<Resp<T>> {
	const result = await fetch(BASE_URL + url, {
		...options,
		credentials: 'include'
	});

	if (result?.status && result.status >= 500) {
		console.error(`Request to ${url} failed with 5xx status ${result.status}`);
	}

	if (result.status && result.status === 401) {
		navigate('/lor')
	}

	let json;
	try {
		json = await result.json();
	} catch (e) {
		console.error(`Request to ${url} failed to parse JSON response`);
		return { data: null, error: '未知返回结构', status: result?.status ?? 0 };
	}

	return result.status !== 200
		? {
				data: null,
				error: json.details,
				status: result.status
			}
		: {
				data: json.data,
				error: null,
				status: 200
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
 * 向url发送一个请求体为body的PATCH请求。请求体类型固定为JSON
 */
export function patch<T = any>(url: string, body: Record<string, any>) {
	return req<T>(url, {
		method: 'PATCH',
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

export async function put(url: string, body: Record<string, any>) {
	const result = await req(url, {
		method: 'put',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	return result.error === null;
}
