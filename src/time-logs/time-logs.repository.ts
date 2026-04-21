import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../common/types/types';
import { PrismaService } from '../common/database/prisma.service';
import { ITimeLogsRepository } from './time-logs.repository.interface';
import { TimeLogModel } from '@prisma/client';
import { IResponseGetDeveloperTime, ITimeLogFilters, IWhereCondition } from './types';



@injectable()
export class TimeLogsRepository implements ITimeLogsRepository {
    constructor(
        @inject(TYPES.PrismaService) private readonly prismaService: PrismaService
    ) { }

    async findActiveTimeLog(taskId: number, userId: number): Promise<TimeLogModel | null> {
        return await this.prismaService.client.timeLogModel.findFirst({
            where: { taskId, userId, endedAt: null }
        });
    }

    async createTimeLog(userId: number, taskId: number, startedAt: Date): Promise<void> {
        await this.prismaService.client.timeLogModel.create({
            data: { userId, taskId, startedAt, endedAt: null }
        });
    }

    async closeTimeLog(logId: number, endedAt: Date, durationMs: number): Promise<void> {
        await this.prismaService.client.timeLogModel.update({
            where: { id: logId },
            data: { endedAt, durationMs }
        });
    }

    async getDeveloperTimeLogs(filters: ITimeLogFilters): Promise<IResponseGetDeveloperTime> {
        const { developerId, projectId, startDate, endDate } = filters;

        const whereCondition: IWhereCondition = {
            userId: developerId
        };

        if (startDate || endDate) {
            whereCondition.startedAt = {};
            if (startDate) whereCondition.startedAt.gte = startDate;
            if (endDate) whereCondition.startedAt.lte = endDate;
        }

        if (projectId) {
            whereCondition.task = {
                projectId: projectId
            };
        }

        const timeLogs = await this.prismaService.client.timeLogModel.findMany({
            where: whereCondition,
            select: {
                id: true,
                startedAt: true,
                endedAt: true,
                durationMs: true,
                task: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        project: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: {
                startedAt: 'desc'
            }
        });

        const stats = {
            totalDurationMs: timeLogs.reduce((sum, log) => sum + (log.durationMs || 0), 0),
            totalHours: (timeLogs.reduce((sum, log) => sum + (log.durationMs || 0), 0) / (1000 * 60 * 60)).toFixed(2),
            uniqueTasksCount: new Set(timeLogs.map(log => log.task.id)).size,
            projectsInvolved: new Set(timeLogs.map(log => log.task.project.id)).size
        };

        return {
            timeLogs,
            stats
        };
    }

}