import { App } from './app';
import { TsLogService } from './common/logger/tslog-logger.service';

function bootstrap(): void {
	const logger = new TsLogService();
	const app = new App(logger);
	app.init();
}

bootstrap();
