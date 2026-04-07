import { BASE_PREFIX } from '../common/base/constants';

export const BASE_AUTH_PATH = `${BASE_PREFIX}/auth`;

export const AUTH_PATHS = {
	REGISTER: `/register`,
	LOGIN: `/login`,
	REFRESH_TOKEN: `/refresh-token`,
	GET_ME: `/get-me`,
	LOGOUT: `/logout`,
} as const;
