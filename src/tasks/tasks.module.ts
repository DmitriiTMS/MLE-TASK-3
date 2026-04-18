import 'reflect-metadata';
import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '../common/types/types';
import { ITasksController } from './tasks.controller.interface';
import { TasksController } from './tasks.controller';
import { ITasksService } from './tasks.service.interface';
import { TasksService } from './tasks.service';
import { ITasksRepository } from './tasks.reposotory.interface';
import { TasksRepository } from './tasks.repository';

export const tasksModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<ITasksController>(TYPES.ITasksController).to(TasksController).inSingletonScope();
	bind<ITasksService>(TYPES.ITasksService).to(TasksService).inSingletonScope();
	bind<ITasksRepository>(TYPES.ITasksRepository).to(TasksRepository).inSingletonScope();
});
