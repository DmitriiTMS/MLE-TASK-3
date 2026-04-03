import 'reflect-metadata';
import { ContainerModule, interfaces } from 'inversify';
import { AuthController } from './auth.controller';
import { TYPES } from '../common/types/types';
import { IAuthController } from './auth.controller.interface';
import { IPasswordHasher } from '../common/utils/hasher/hasher.interface';
import { BcryptHasher } from '../common/utils/hasher/bcrypt.hasher';
import { IAuthService } from './auth.service.interface';
import { AuthService } from './auth.service';

export const authModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<IAuthController>(TYPES.IAuthController).to(AuthController).inSingletonScope();
	bind<IAuthService>(TYPES.IAuthService).to(AuthService).inSingletonScope();
	bind<IPasswordHasher>(TYPES.IPasswordHasher).to(BcryptHasher).inSingletonScope();
});
