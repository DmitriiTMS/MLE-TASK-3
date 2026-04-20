import { TaskStatus } from "@prisma/client";

export interface IProjectRequestModel {
	name: string;
	description?: string | null;
	userId: number;
}

export interface IProjectRequestUpdate {
	name?: string;
	description?: string | null;
}

export interface IProjectDatabaseData {
	id: number;
	name: string;
	description?: string | null;
	userId: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface IProjectResponse {
	id: number;
	name: string;
	description?: string | null;
	userId?: number;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface IResponseProjectsRepository {
	id: number
	name: string
	description: string | null
	createdAt: Date
	updatedAt: Date
	userId: number
	tasks: {
		status: TaskStatus
		executor: {
			name: string
		} | null
	}[]
}

export interface IResponseProjectsController {
	id: number
	name: string
	description: string | null
	createdAt: Date
	updatedAt: Date
	userId: number
	tasks: {
		status: TaskStatus
		name: string
	}[]
}


