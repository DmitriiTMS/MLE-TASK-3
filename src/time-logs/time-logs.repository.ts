import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../common/types/types';
import { PrismaService } from '../common/database/prisma.service';
import { ITimeLogsRepository } from './time-logs.repository.interface';
import { TimeLogModel } from '@prisma/client';
import {
	IDeveloperTimeStats,
	IResponseGetDeveloperTime,
	IResponseGetProjectTime,
	ITimeLogFilters,
	ITimeLogForProjectFilters,
	IWhereCondition,
	IWhereConditionProject,
} from './types';

@injectable()
export class TimeLogsRepository implements ITimeLogsRepository {
	constructor(@inject(TYPES.PrismaService) private readonly prismaService: PrismaService) {}

	async findActiveTimeLog(taskId: number, userId: number): Promise<TimeLogModel | null> {
		return await this.prismaService.client.timeLogModel.findFirst({
			where: { taskId, userId, endedAt: null },
		});
	}

	async createTimeLog(userId: number, taskId: number, startedAt: Date): Promise<void> {
		await this.prismaService.client.timeLogModel.create({
			data: { userId, taskId, startedAt, endedAt: null },
		});
	}

	async closeTimeLog(logId: number, endedAt: Date, durationMs: number): Promise<void> {
		await this.prismaService.client.timeLogModel.update({
			where: { id: logId },
			data: { endedAt, durationMs },
		});
	}

	async getDeveloperTimeLogs(filters: ITimeLogFilters): Promise<IResponseGetDeveloperTime> {
		const { developerId, projectId, startDate, endDate } = filters;

		const whereCondition: IWhereCondition = {
			userId: developerId,
		};

		if (startDate || endDate) {
			whereCondition.startedAt = {};
			if (startDate) whereCondition.startedAt.gte = startDate;
			if (endDate) whereCondition.startedAt.lte = endDate;
		}

		if (projectId) {
			whereCondition.task = {
				projectId: projectId,
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
								name: true,
							},
						},
					},
				},
				user: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				startedAt: 'desc',
			},
		});

		const stats = {
			totalDurationMs: timeLogs.reduce((sum, log) => sum + (log.durationMs || 0), 0),
			totalHours: (
				timeLogs.reduce((sum, log) => sum + (log.durationMs || 0), 0) /
				(1000 * 60 * 60)
			).toFixed(2),
			uniqueTasksCount: new Set(timeLogs.map((log) => log.task.id)).size,
			projectsInvolved: new Set(timeLogs.map((log) => log.task.project.id)).size,
		};

		return {
			timeLogs,
			stats,
		};
	}

	async getProjectTimeLogs(filters: ITimeLogForProjectFilters): Promise<IResponseGetProjectTime> {
		const { projectId, startDate, endDate } = filters;

		const whereCondition: IWhereConditionProject = {
			task: {
				projectId: projectId,
			},
		};

		if (startDate || endDate) {
			whereCondition.startedAt = {};
			if (startDate) whereCondition.startedAt.gte = startDate;
			if (endDate) whereCondition.startedAt.lte = endDate;
		}

		const timeLogs = await this.prismaService.client.timeLogModel.findMany({
			where: whereCondition,
			select: {
				id: true,
				startedAt: true,
				endedAt: true,
				durationMs: true,
				userId: true,
				taskId: true,
				task: {
					select: {
						id: true,
						title: true,
						status: true,
					},
				},
				user: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				startedAt: 'desc',
			},
		});

		const project = await this.prismaService.client.projectModel.findUnique({
			where: { id: projectId },
			select: { id: true, name: true },
		});

		// Агрегируем статистику по разработчикам
		const developersMap = new Map<number, IDeveloperTimeStats>();

		for (const log of timeLogs) {
			const developerId = log.userId;
			const duration = log.durationMs || 0;

			if (!developersMap.has(developerId)) {
				developersMap.set(developerId, {
					developerId: developerId,
					developerName: log.user.name,
					totalDurationMs: 0,
					totalHours: '0',
					tasksCount: 0,
					logsCount: 0,
				});
			}

			const devStats = developersMap.get(developerId)!;
			devStats.totalDurationMs += duration;
			devStats.logsCount++;
		}

		// Добавляем уникальные задачи для каждого разработчика
		for (const log of timeLogs) {
			const devStats = developersMap.get(log.userId);
			if (devStats) {
				// Подсчёт уникальных задач (можно оптимизировать, но для наглядности)
				const uniqueTasks = new Set(
					timeLogs.filter((l) => l.userId === log.userId).map((l) => l.taskId),
				);
				devStats.tasksCount = uniqueTasks.size;
			}
		}

		// Обновляем totalHours для каждого разработчика
		for (const devStats of developersMap.values()) {
			devStats.totalHours = (devStats.totalDurationMs / (1000 * 60 * 60)).toFixed(2);
		}

		// Общая статистика по проекту
		const totalDurationMs = Array.from(developersMap.values()).reduce(
			(sum, dev) => sum + dev.totalDurationMs,
			0,
		);

		const projectStats = {
			projectId: project?.id || null,
			projectName: project?.name || null,
			totalDurationMs: totalDurationMs,
			totalHours: (totalDurationMs / (1000 * 60 * 60)).toFixed(2),
			developersCount: developersMap.size,
			tasksCount: new Set(timeLogs.map((log) => log.taskId)).size,
			logsCount: timeLogs.length,
			developers: Array.from(developersMap.values()).sort(
				(a, b) => b.totalDurationMs - a.totalDurationMs,
			),
		};

		return {
			projectStats,
			timeLogs,
		};
	}
}
