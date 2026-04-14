import { BASE_PREFIX } from '../common/base/constants';

export const BASE_TASKS_PATH = `${BASE_PREFIX}/tasks`;

export const TASKS_PATHS = {
	GET_ONE_TASK: `/:taskId`,
} as const;

export const TASKS_MESSAGES = {
	TASK_NOT_FOUND: 'Задача не найдена',
	TASK_BAN_ON_VIEWING: 'Доступ запрещён: вы не являетесь создателем или исполнителем задачи',
} as const;
