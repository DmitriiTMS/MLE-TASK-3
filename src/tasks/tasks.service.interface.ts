import { TaskModel } from '@prisma/client';
import { TaskEntity } from './entity/task.entity';
import { ICreateTaskData } from './types';

export interface ITasksService {
	getTaskOrThrow(taskId: number, message: string, errorPath?: string): Promise<TaskModel>;
	createTask(data: ICreateTaskData): Promise<TaskEntity>;
	getOneTask(userId: number, taskId: number): Promise<TaskEntity>;
}
