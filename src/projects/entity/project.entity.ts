import { IProjectResponse } from "../types";

export class ProjectEntity {
    private _id!: number;
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

    get id() { return this._id; }
    get name() { return this._name; }
    get userId() { return this._userId; }
    get description() { return this._description; }
    get createdAt() { return this._createdAt; }
    get updatedAt() { return this._updatedAt; }

    static fromDatabase(data: IProjectResponse): ProjectEntity {
        const entity = new ProjectEntity(data.name, data.userId, data.description);
        entity._id = data.id;
        entity._createdAt = data.createdAt;
        entity._updatedAt = data.updatedAt;
        return entity;
    }

    toResponse(): IProjectResponse {
        return {
            id: this._id,
            name: this._name,
            description: this._description,
            userId: this._userId,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        };
    }
}


