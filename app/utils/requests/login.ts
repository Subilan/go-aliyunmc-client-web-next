import { post } from '~/utils/requests';

/**
 * 发送登录请求
 * @param username 用户名
 * @param password 密码明文
 * @param remember 是否记住
 * @returns 响应
 */
export default function login(username: string, password: string, remember = false) {
	return post('/user/login', {
		username,
		password,
		remember
	});
}