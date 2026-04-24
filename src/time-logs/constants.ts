import { BASE_PREFIX } from '../common/base/constants';

export const BASE_TIME_LOGS_PATH = `${BASE_PREFIX}/reports`;

export const TIME_LOGS_PATHS = {
	GET_DEVELOPER_TIME_LOGS: '/developer/:developerId',
	GET_PROJECT_TIME_LOGS: '/project/:projectId',
} as const;
