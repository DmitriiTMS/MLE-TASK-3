import { TimeLogModel } from "@prisma/client";
import { IResponseGetDeveloperTime, ITimeLogFilters } from "./types";

export interface ITimeLogsRepository {
    findActiveTimeLog(taskId: number, userId: number): Promise<TimeLogModel | null>;
    createTimeLog(userId: number, taskId: number, startedAt: Date): Promise<void>;
    closeTimeLog(logId: number, endedAt: Date, durationMs: number): Promise<void>;
    getDeveloperTimeLogs(filters: ITimeLogFilters): Promise<IResponseGetDeveloperTime>;
}
