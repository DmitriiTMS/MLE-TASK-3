import 'reflect-metadata';
import { Container, ContainerModule, interfaces } from 'inversify';
import { TYPES } from './common/types/types';
import { ILogger } from './common/logger/logger.interface';
import { TsLogService } from './common/logger/tslog-logger.service';
import { IExeptionFilter } from './common/error/exeption.filter.interface';
import { ExeptionFilter } from './common/error/exeption.filter';
import { App } from './app';
import { authModule } from './auth/auth.module';
import { userModule } from './users/user.module';
import { IConfigService } from './common/config/config.service.interface';
import { ConfigService } from './common/config/config.service';

interface IBotstrap {
	app: App;
	appContainer: Container;
}

export const appModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<IConfigService>(TYPES.IConfigService).to(ConfigService).inSingletonScope();
	bind<ILogger>(TYPES.ILogger).to(TsLogService).inSingletonScope();
	bind<IExeptionFilter>(TYPES.IExeptionFilter).to(ExeptionFilter).inSingletonScope();
	bind<App>(TYPES.Application).to(App).inSingletonScope();
});


async function bootstrap(): Promise<IBotstrap> {
	const appContainer = new Container();
	appContainer.load(appModule, authModule, userModule);
	const app = appContainer.get<App>(TYPES.Application);
	await app.init();
	return { app, appContainer };
}

export const boot = bootstrap();
