import { BASE_PREFIX } from '../common/base/constants';

export const AUTH_PATH = {
	BASE_AUTH: `${BASE_PREFIX}/auth`,
	REGISTER: '/register',
	LOGIN: '/login',
	REFRESH_TOKEN: '/refresh-token',
	GET_ME: '/get-me',
	LOGOUT: '/logout',
} as const;
