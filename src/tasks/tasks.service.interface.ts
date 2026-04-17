import { TaskModel } from '@prisma/client';
import { TaskEntity } from './entity/task.entity';
import { ICreateTaskData, IUpdateAssignUserService } from './types';
import { UpdateTaskDto } from './dto/update-task.dto';

export interface ITasksService {
	getTaskOrThrow(taskId: number, message: string, errorPath?: string): Promise<TaskModel>;
	createTask(data: ICreateTaskData): Promise<TaskEntity>;
	getOneTask(userId: number, taskId: number): Promise<TaskEntity>;
	updateTask(userId: number, taskId: number, data: UpdateTaskDto): Promise<void>;
	remove(taskId: number, userId: number): Promise<void>;
	assignTaskUser(data: IUpdateAssignUserService): Promise<void>;
}
