import { CreateProjectsDto } from "./dto/create-projects.dto";
import { ProjectEntity } from "./entity/project.entity";


export interface IProjectsService {
	create(project: CreateProjectsDto, userId: number): Promise<ProjectEntity>;
	getAllProjectsByUserId(userId: number): Promise<ProjectEntity[]>;
	getProjectByUserId(projectId: number, userId: number): Promise<ProjectEntity>;
}
