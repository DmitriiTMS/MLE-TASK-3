import 'reflect-metadata';
import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '../common/types/types';
import { IProjectsController } from './projects.controller.interface';
import { ProjectsController } from './projects.controller';
import { IProjectsService } from './projects.service.interface';
import { ProjectsService } from './projects.service';
import { IProjectsRepository } from './projects.repository.interface';
import { ProjectsRepository } from './projects.repository';

export const projectsModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<IProjectsController>(TYPES.IProjectsController).to(ProjectsController).inSingletonScope();
	bind<IProjectsService>(TYPES.IProjectsService).to(ProjectsService).inSingletonScope();
	bind<IProjectsRepository>(TYPES.IProjectsRepository).to(ProjectsRepository).inSingletonScope();
});
