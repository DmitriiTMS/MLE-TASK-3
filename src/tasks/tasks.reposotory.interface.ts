import { TaskModel } from '@prisma/client';
import { ICreateTaskData, IUpdateTaskData } from './types';

export interface ITasksRepository {
	create(data: ICreateTaskData): Promise<TaskModel>;
	findById(taskId: number): Promise<TaskModel | null>;
	update(taskId: number, data: IUpdateTaskData): Promise<void>;
}
