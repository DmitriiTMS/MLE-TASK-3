import { TimeLogModel } from '@prisma/client';
import {
	IResponseGetDeveloperTime,
	IResponseGetProjectTime,
	ITimeLogFilters,
	ITimeLogForProjectFilters,
} from './types';

export interface ITimeLogsRepository {
	findActiveTimeLog(taskId: number, userId: number): Promise<TimeLogModel | null>;
	createTimeLog(userId: number, taskId: number, startedAt: Date): Promise<void>;
	closeTimeLog(logId: number, endedAt: Date, durationMs: number): Promise<void>;
	getDeveloperTimeLogs(filters: ITimeLogFilters): Promise<IResponseGetDeveloperTime>;
	getProjectTimeLogs(filters: ITimeLogForProjectFilters): Promise<IResponseGetProjectTime>;
}
