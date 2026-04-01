import 'reflect-metadata';
import { ContainerModule, interfaces } from "inversify";
import { TYPES } from '../common/types/types';
import { IUserService } from './user.service.interface';
import { UserService } from './user.service';

export const userModule = new ContainerModule((bind: interfaces.Bind) => {
    bind<IUserService>(TYPES.IUserService).to(UserService).inSingletonScope();
});