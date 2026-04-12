import { TaskStatus } from '@prisma/client';

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
}

export interface IUpdateTaskData {
	title?: string;
	description?: string | null;
	dueDate?: Date;
	status?: TaskStatus;
	executorUserId?: number | null;
}
