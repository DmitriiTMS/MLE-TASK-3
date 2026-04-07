export interface IProjectRequestModel {
    name: string;
    description?: string | null;
    userId: number;
}

export interface IProjectResponse {
    id: number;
    name: string;
    description?: string | null;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
}