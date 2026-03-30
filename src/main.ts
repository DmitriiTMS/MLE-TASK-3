import { App } from './app';
import { ExeptionFilter } from './common/error/exeption.filter';
import { TsLogService } from './common/logger/tslog-logger.service';

function bootstrap(): void {
	const logger = new TsLogService();
	const exeptionFilter = new ExeptionFilter(logger);
	const app = new App(logger, exeptionFilter);
	app.init();
}

bootstrap();
