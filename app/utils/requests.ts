export const BASE_URL = 'http://localhost:45678';

async function req<T = any>(
	url: string,
	options: RequestInit
): Promise<{ data: null; error: string } | { data: T; error: null }> {
	const result = await fetch(BASE_URL + url, {
		...options,
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

export function get<T = any>(url: string) {
	return req<T>(url, {
		method: 'get'
	});
}

export function post<T = any>(url: string, body: Record<string, any>) {
	return req<T>(url, {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});
}

export async function del(url: string) {
	const result = await req(url, {
		method: 'delete'
	});

	return result.error === null;
}
