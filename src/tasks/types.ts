import { TaskStatus } from '@prisma/client';

export interface IProjectForTaskData {
	name: string;
	description: string;
}

export interface ICreateTaskData {
	projectId: number;
	createUserId: number;
	title: string;
	dueDate: Date;
	completedAt?: Date;
	description?: string | null;
	executorUserId?: number | null;
	status?: TaskStatus;
}

export interface ITaskDatabaseData {
	id: number;
	title: string;
	description?: string | null;
	dueDate: Date;
	status: TaskStatus;
	completedAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
	projectId: number;
	createUserId: number;
	executorUserId?: number | null;
	project?: IProjectForTaskData;
}

export interface ITaskResponse {
	id: number;
	title: string;
	description?: string | null;
	dueDate: Date;
	status: TaskStatus;
	completedAt?: Date | null;
	projectId: number;
	createUserId: number;
	executorUserId?: number | null;
	project?: IProjectForTaskData;
}

export interface IUpdateTaskData {
	title?: string;
	description?: string | null;
	dueDate?: Date | string;
	status?: TaskStatus;
	executorUserId?: number | null;
}

export interface IUpdateAssignUserRepository {
	taskId: number;
	executorUserId: number;
}

export interface IUpdateAssignUserService {
	userId: number;
	info: IUpdateAssignUserRepository;
}
