import { TaskModel } from '@prisma/client';
import { ICreateTaskData } from './types';

export interface ITasksRepository {
	create(data: ICreateTaskData): Promise<TaskModel>;
}
