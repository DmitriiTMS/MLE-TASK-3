import { BASE_PREFIX } from '../common/base/constants';

export const AuthPath = {
	BASE_AUTH: `${BASE_PREFIX}/auth`,
	REGISTER: '/register',
	LOGIN: '/login',
} as const;
