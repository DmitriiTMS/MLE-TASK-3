import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { ITimeLogsService } from './time-logs.service.interface';
import { TYPES } from '../common/types/types';
import { ITimeLogsRepository } from './time-logs.repository.interface';
import { TaskEntity } from '../tasks/entity/task.entity';


@injectable()
export class TimeLogsService implements ITimeLogsService {
    constructor(
        @inject(TYPES.ITimeLogsRepository) private readonly timeLogsRepository: ITimeLogsRepository,
    ) { }

    async startWorkOnTask(task: TaskEntity, userId: number): Promise<void> {
        const activeLog = await this.timeLogsRepository.findActiveTimeLog(task.id, userId);
        if (activeLog) {
            return
        }
        await this.timeLogsRepository.createTimeLog(userId, task.id, new Date());
    }

    async completeTask(task: TaskEntity, userId: number): Promise<void> {
        const activeLog = await this.timeLogsRepository.findActiveTimeLog(task.id, userId);
        if (activeLog) {
            const endedAt = new Date();
            const durationMs = endedAt.getTime() - activeLog.startedAt.getTime();
            await this.timeLogsRepository.closeTimeLog(activeLog.id, endedAt, durationMs);
        }

    }
}
