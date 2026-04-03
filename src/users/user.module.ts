import 'reflect-metadata';
import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '../common/types/types';
import { IUserService } from './user.service.interface';
import { UserService } from './user.service';
import { IUserRepository } from './user.repository.interface';
import { UserRepository } from './user.repository';

export const userModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<IUserService>(TYPES.IUserService).to(UserService).inSingletonScope();
	bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository).inSingletonScope();
});
