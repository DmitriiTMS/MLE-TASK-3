import { TaskModel } from '@prisma/client';
import {
	IAssignUserResponseRepository,
	ICreateTaskData,
	IUpdateAssignUserRepository,
	IUpdateTaskData,
} from './types';

export interface ITasksRepository {
	create(data: ICreateTaskData): Promise<TaskModel>;
	findById(taskId: number): Promise<TaskModel | null>;
	update(taskId: number, data: IUpdateTaskData): Promise<void>;
	remove(taskId: number): Promise<void>;
	assignTaskUser(data: IUpdateAssignUserRepository): Promise<void>;
}
