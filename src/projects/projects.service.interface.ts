import { CreateProjectsDto } from "./dto/create-projects.dto";
import { ProjectEntity } from "./entity/project.entity";


export interface IProjectsService {
	create(project: CreateProjectsDto, userId: number): Promise<ProjectEntity>;
}
