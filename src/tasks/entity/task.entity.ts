import { TaskStatus } from '@prisma/client';
import { IProjectForTaskData, ITaskDatabaseData, ITaskResponse } from '../types';

export class TaskEntity {
	private _id: number;
	private _title: string;
	private _description?: string | null;
	private _dueDate: Date;
	private _status: TaskStatus;
	private _completedAt?: Date | null;
	private _createdAt: Date;
	private _updatedAt: Date;
	private _projectId: number;
	private _createUserId: number;
	private _executorUserId?: number | null;
	private _project?: IProjectForTaskData;

	constructor(
		title: string,
		dueDate: Date,
		projectId: number,
		createUserId: number,
		description?: string | null,
		executorUserId?: number | null,
		status?: TaskStatus,
	) {
		this._title = title;
		this._dueDate = dueDate;
		this._projectId = projectId;
		this._createUserId = createUserId;
		this._description = description;
		this._executorUserId = executorUserId;
		this._status = status || TaskStatus.CREATED;
		this._createdAt = new Date();
		this._updatedAt = new Date();
		this._completedAt = null;
	}

	get id(): number {
		return this._id;
	}

	get title(): string {
		return this._title;
	}

	get description(): string | null {
		return this._description || null;
	}

	get dueDate(): Date {
		return this._dueDate;
	}

	get status(): TaskStatus {
		return this._status;
	}

	get completedAt(): Date | null {
		return this._completedAt || null;
	}

	get createdAt(): Date {
		return this._createdAt;
	}

	get updatedAt(): Date {
		return this._updatedAt;
	}

	get projectId(): number {
		return this._projectId;
	}

	get createUserId(): number {
		return this._createUserId;
	}

	get executorUserId(): number | null {
		return this._executorUserId || null;
	}

	get project(): IProjectForTaskData | null {
		return this._project || null;
	}

	set project(value: IProjectForTaskData) {
		this._project = value;
	}

	static fromDatabase(data: ITaskDatabaseData): TaskEntity {
		const entity = new TaskEntity(
			data.title,
			data.dueDate,
			data.projectId,
			data.createUserId,
			data.description,
			data.executorUserId,
			data.status,
		);
		entity._id = data.id;
		entity._createdAt = data.createdAt;
		entity._updatedAt = data.updatedAt;
		if (data.completedAt) {
			entity._completedAt = data.completedAt;
		}
		if (data.project) {
			entity._project = data.project;
		}
		return entity;
	}

	isCreatorUser(userId: number): boolean {
		return this._createUserId === userId;
	}

	isExecutorUser(userId: number): boolean {
		return this._executorUserId === userId;
	}

	isCompleted(): boolean {
		return this._status === TaskStatus.COMPLETED;
	}

	isInProgress(): boolean {
		return this._status === TaskStatus.IN_PROGRESS;
	}

	isCreated(): boolean {
		return this._status === TaskStatus.CREATED;
	}

	complete(): void {
		if (this._status !== TaskStatus.COMPLETED) {
			this._status = TaskStatus.COMPLETED;
			this._completedAt = new Date();
			this._updatedAt = new Date();
		}
	}

	startProgress(): void {
		if (this._status === TaskStatus.CREATED) {
			this._status = TaskStatus.IN_PROGRESS;
			this._updatedAt = new Date();
		}
	}

	updateFields(updates: {
		title?: string;
		description?: string | null;
		dueDate?: Date | string;
		status?: TaskStatus;
		executorUserId?: number | null;
	}): Partial<{
		title: string;
		description: string | null;
		dueDate: Date | string;
		status: TaskStatus;
		executorUserId: number | null;
		completedAt: Date | null;
	}> {
		const result: Partial<{
			title: string;
			description: string | null;
			dueDate: Date | string;
			status: TaskStatus;
			executorUserId: number | null;
			completedAt: Date | null;
		}> = {};

		if (updates.title !== undefined && updates.title !== this._title) {
			result.title = updates.title;
		}
		if (updates.description !== undefined && updates.description !== this._description) {
			result.description = updates.description;
		}
		if (updates.dueDate !== undefined && updates.dueDate !== this._dueDate) {
			result.dueDate = updates.dueDate;
		}
		if (updates.status !== undefined && updates.status !== this._status) {
			result.status = updates.status;

			// Автоматически устанавливаем completedAt при завершении
			if (updates.status === TaskStatus.COMPLETED && this._status !== TaskStatus.COMPLETED) {
				result.completedAt = new Date();
			}

			// Если статус меняется с COMPLETED на другой, сбрасываем completedAt
			if (updates.status !== TaskStatus.COMPLETED && this._status === TaskStatus.COMPLETED) {
				result.completedAt = null;
			}
		}
		if (updates.executorUserId !== undefined && updates.executorUserId !== this._executorUserId) {
			result.executorUserId = updates.executorUserId;
		}

		return result;
	}

	toResponse(): ITaskResponse {
		const response: ITaskResponse = {
			id: this._id,
			title: this._title,
			description: this._description,
			dueDate: this._dueDate,
			status: this._status,
			completedAt: this._completedAt,
			projectId: this._projectId,
			createUserId: this._createUserId,
			executorUserId: this._executorUserId,
		};

		if (this._project) {
			response.project = this._project;
		}

		return response;
	}
}
