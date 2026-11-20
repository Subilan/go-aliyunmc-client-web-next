export const LOGIN_PATH = '/lor';

/** 判断一个站内路径是否就是登录页本身 */
export function isLoginPath(path: string): boolean {
	const { pathname } = new URL(path, 'http://localhost');
	return pathname === LOGIN_PATH;
}

/**
 * 从请求 URL 或站内路径中取出登录后应返回的站内路径。
 * 首页与登录页自身不需要回跳，统一返回 `/`。
 */
export function resolveLoginRedirectTarget(target: string): string {
	const { pathname, search } = new URL(target, 'http://localhost');
	if (pathname === '/' || pathname === LOGIN_PATH) return '/';
	return `${pathname}${search}`;
}

/**
 * 根据回跳目标构造登录页路径。
 */
export function buildLoginPath(target: string): string {
	const resolved = resolveLoginRedirectTarget(target);
	if (resolved === '/') return LOGIN_PATH;
	return `${LOGIN_PATH}?redirect=${encodeURIComponent(resolved)}`;
}

/**
 * 校验回跳目标，仅允许站内绝对路径，避免开放重定向。
 */
export function sanitizeRedirectTarget(target: string | null): string {
	if (!target) return '/';
	if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return '/';
	if (isLoginPath(target)) return '/';
	return target;
}