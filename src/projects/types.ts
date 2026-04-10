export interface IProjectRequestModel {
    name: string;
    description?: string | null;
    userId: number;
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