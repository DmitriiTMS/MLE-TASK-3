import { IProjectDatabaseData, IProjectResponse } from '../types';

export class ProjectEntity {
	private _id: number;
	private _name: string;
	private _userId: number;
	private _description?: string | null;
	private _createdAt: Date;
	private _updatedAt: Date;

	constructor(name: string, userId: number, description?: string | null) {
		this._name = name;
		this._userId = userId;
		this._description = description;
		this._createdAt = new Date();
		this._updatedAt = new Date();
	}

	get id(): number {
		return this._id;
	}
	get name(): string {
		return this._name;
	}
	get userId(): number {
		return this._userId;
	}
	get description(): string | null {
		if (!this._description) {
			return null;
		}
		return this._description;
	}
	get createdAt(): Date {
		return this._createdAt;
	}
	get updatedAt(): Date {
		return this._updatedAt;
	}

	static fromDatabase(data: IProjectDatabaseData): ProjectEntity {
		const entity = new ProjectEntity(data.name, data.userId, data.description);
		entity._id = data.id;
		entity._createdAt = data.createdAt;
		entity._updatedAt = data.updatedAt;
		return entity;
	}

	isOwnedBy(userId: number): boolean {
		return this._userId === userId;
	}

	updateFields(updates: { name?: string; description?: string }): {
		name?: string;
		description?: string | null;
	} {
		const result: { name?: string; description?: string | null } = {};
		if (updates.name !== undefined) {
			result.name = updates.name;
		}
		if (updates.description !== undefined) {
			result.description = updates.description;
		}
		return result;
	}

	toResponse(): IProjectResponse {
		return {
			id: this._id,
			name: this._name,
			description: this._description,
		};
	}
}
