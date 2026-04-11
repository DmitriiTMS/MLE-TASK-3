import { BASE_PREFIX } from '../common/base/constants';

export const BASE_PROJECTS_PATH = `${BASE_PREFIX}/projects`;

export const PROJECTS_PATH = {
	CREATE: '',
	GET_ALL_PROJECTS_BY_USER_ID: '',
	GET_PROJECT_BY_USER_ID: '/:projectId',
	REMOVE_PROJECT: '/:projectId',
} as const;
