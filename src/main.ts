import 'reflect-metadata';
import { Container, ContainerModule, interfaces } from 'inversify';
import { TYPES } from './common/types/types';
import { ILogger } from './common/logger/logger.interface';
import { TsLogService } from './common/logger/tslog-logger.service';
import { IExeptionFilter } from './common/error/exeption.filter.interface';
import { ExeptionFilter } from './common/error/exeption.filter';
import { App } from './app';

interface IBotstrap {
	app: App;
	appContainer: Container;
}

export const appBindings = new ContainerModule((bind: interfaces.Bind) => {
	bind<ILogger>(TYPES.ILogger).to(TsLogService);
	bind<IExeptionFilter>(TYPES.IExeptionFilter).to(ExeptionFilter);
	bind<App>(TYPES.Application).to(App);
});

async function bootstrap(): Promise<IBotstrap> {
	const appContainer = new Container();
	appContainer.load(appBindings);
	const app = appContainer.get<App>(TYPES.Application);
	await app.init();
	return { app, appContainer };
}

export const boot = bootstrap();
