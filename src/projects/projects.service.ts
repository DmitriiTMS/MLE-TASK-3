import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { CreateProjectsDto } from './dto/create-projects.dto';
import { ProjectEntity } from './entity/project.entity';
import { IProjectsService } from './projects.service.interface';
import { ProjectsRepository } from './projects.repository';
import { TYPES } from '../common/types/types';
import { HttpError } from '../common/error/http-error';
import { HttpErrorCode, HttpErrorMessages } from '../common/error/constants';
import { PROJECTS_PATH } from './constants';
import { IUserService } from '../users/user.service.interface';

@injectable()
export class ProjectsService implements IProjectsService {
	constructor(
		@inject(TYPES.IUserService) private readonly userService: IUserService,
		@inject(TYPES.IProjectsRepository) private readonly projectsRepository: ProjectsRepository,
	) {}

	async getAllProjectsByUserId(userId: number): Promise<ProjectEntity[]> {
		await this.userService.getUserOrThrow(userId, PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID);
		const result = await this.projectsRepository.getAllProjectsByUserId(userId);
		return result.map((project) => ProjectEntity.fromDatabase(project));
	}

	async getProjectByUserId(projectId: number, userId: number): Promise<ProjectEntity> {
		await this.userService.getUserOrThrow(userId, PROJECTS_PATH.GET_PROJECT_BY_USER_ID);

		const projectData = await this.projectsRepository.findById(projectId);
		if (!projectData) {
			throw new HttpError(
				HttpErrorCode.NOT_FOUND,
				HttpErrorMessages[HttpErrorCode.NOT_FOUND],
				PROJECTS_PATH.GET_PROJECT_BY_USER_ID,
			);
		}

		const project = ProjectEntity.fromDatabase(projectData);

		if (!project.isOwnedBy(userId)) {
			throw new HttpError(
				HttpErrorCode.FORBIDDEN,
				HttpErrorMessages[HttpErrorCode.FORBIDDEN],
				PROJECTS_PATH.GET_PROJECT_BY_USER_ID,
			);
		}

		return project;
	}

	async create({ name, description }: CreateProjectsDto, userId: number): Promise<ProjectEntity> {
		await this.userService.getUserOrThrow(userId, PROJECTS_PATH.CREATE);
		try {
			const createdProject = new ProjectEntity(name, userId, description);
			const project = await this.projectsRepository.create({
				name: createdProject.name,
				description: createdProject.description,
				userId: createdProject.userId,
			});
			return ProjectEntity.fromDatabase(project);
		} catch (error) {
			throw new HttpError(
				HttpErrorCode.INTERNAL_SERVER_ERROR,
				HttpErrorMessages[HttpErrorCode.INTERNAL_SERVER_ERROR],
				PROJECTS_PATH.CREATE,
			);
		}
	}

	async remove(projectId: number, userId: number): Promise<void> {
		await this.userService.getUserOrThrow(userId, PROJECTS_PATH.REMOVE_PROJECT);

		const projectData = await this.projectsRepository.findById(projectId);
		if (!projectData) {
			throw new HttpError(
				HttpErrorCode.NOT_FOUND,
				HttpErrorMessages[HttpErrorCode.NOT_FOUND],
				PROJECTS_PATH.REMOVE_PROJECT,
			);
		}

		const project = ProjectEntity.fromDatabase(projectData);

		if (!project.isOwnedBy(userId)) {
			throw new HttpError(
				HttpErrorCode.FORBIDDEN,
				HttpErrorMessages[HttpErrorCode.FORBIDDEN],
				PROJECTS_PATH.REMOVE_PROJECT,
			);
		}

		await this.projectsRepository.remove(projectId);
	}
}
