import 'reflect-metadata';
import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '../common/types/types';
import { ITimeLogsController } from './time-logs.controller.interface';
import { TimeLogsController } from './time-logs.controller';
import { ITimeLogsService } from './time-logs.service.interface';
import { TimeLogsService } from './time-logs.service';
import { ITimeLogsRepository } from './time-logs.repository.interface';
import { TimeLogsRepository } from './time-logs.repository';

export const timeLogsModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<ITimeLogsController>(TYPES.ITimeLogsController).to(TimeLogsController).inSingletonScope();
	bind<ITimeLogsService>(TYPES.ITimeLogsService).to(TimeLogsService).inSingletonScope();
	bind<ITimeLogsRepository>(TYPES.ITimeLogsRepository).to(TimeLogsRepository).inSingletonScope();
});
