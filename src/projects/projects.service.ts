import 'reflect-metadata';
import { inject, injectable } from "inversify";
import { CreateProjectsDto } from "./dto/create-projects.dto";
import { ProjectEntity } from "./entity/project.entity";
import { IProjectsService } from "./projects.service.interface";
import { ProjectsRepository } from './projects.repository';
import { TYPES } from '../common/types/types';
import { ProjectModel } from '@prisma/client';
import { IUserRepository } from '../users/user.repository.interface';
import { HttpError } from '../common/error/http-error';
import { HttpErrorCode, HttpErrorMessages } from '../common/error/constants';
import { PROJECTS_PATH } from './constants';


@injectable()
export class ProjectsService implements IProjectsService {
    constructor(
        @inject(TYPES.IUserRepository) private readonly userRepository: IUserRepository,
        @inject(TYPES.IProjectsRepository) private readonly projectsRepository: ProjectsRepository
    ) { }

    async create({ name, description }: CreateProjectsDto, userId: number): Promise<ProjectEntity> {
        const userExists = await this.userRepository.findById(userId);
        if (!userExists) {
            throw new HttpError(
                HttpErrorCode.NOT_FOUND,
                HttpErrorMessages[HttpErrorCode.NOT_FOUND],
                PROJECTS_PATH.CREATE
            );
        }

        try {
            const createdProject = new ProjectEntity(name, userId, description);
            const savedProject = await this.projectsRepository.create({
                name: createdProject.name,
                description: createdProject.description,
                userId: createdProject.userId
            });
            return this.mapToEntity(savedProject);
        } catch (error) {
            throw new HttpError(
                HttpErrorCode.INTERNAL_SERVER_ERROR,
                HttpErrorMessages[HttpErrorCode.INTERNAL_SERVER_ERROR],
                PROJECTS_PATH.CREATE
            );
        }
    }

    private mapToEntity(model: ProjectModel): ProjectEntity {
        return ProjectEntity.fromDatabase({
            id: model.id,
            name: model.name,
            userId: model.userId,
            description: model.description,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        });
    }

}