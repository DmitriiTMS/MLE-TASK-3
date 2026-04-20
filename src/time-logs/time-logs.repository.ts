import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../common/types/types';
import { PrismaService } from '../common/database/prisma.service';
import { ITimeLogsRepository } from './time-logs.repository.interface';
import { TimeLogModel } from '@prisma/client';


@injectable()
export class TimeLogsRepository implements ITimeLogsRepository {
    constructor(
        @inject(TYPES.PrismaService) private readonly prismaService: PrismaService
    ) { }

    async findActiveTimeLog(taskId: number, userId: number):Promise<TimeLogModel | null> {
        return await this.prismaService.client.timeLogModel.findFirst({
            where: { taskId, userId, endedAt: null }
        });
    }

    async createTimeLog(userId: number, taskId: number, startedAt: Date):Promise<void> {
       await this.prismaService.client.timeLogModel.create({
            data: { userId, taskId, startedAt, endedAt: null }
        });
    }

    async closeTimeLog(logId: number, endedAt: Date, durationMs: number):Promise<void> {
       await this.prismaService.client.timeLogModel.update({
            where: { id: logId },
            data: { endedAt, durationMs }
        });
    }

}