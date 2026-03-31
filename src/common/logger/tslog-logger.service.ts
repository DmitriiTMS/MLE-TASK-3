import 'reflect-metadata';
import { injectable } from 'inversify';
import { ILogger } from './logger.interface';
import { Logger, ILogObj } from 'tslog';

@injectable()
export class TsLogService implements ILogger {
	public logger: Logger<ILogObj>;

	constructor() {
		this.logger = new Logger({
			type: 'pretty',
			prettyLogTemplate: '{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}} {{logLevelName}} [{{name}}] ',
			prettyLogTimeZone: 'local',
			maskValuesOfKeys: ['password', 'token', 'secret', 'authorization'],
			name: 'LoggerService',
		});
	}

	log(...args: unknown[]): void {
		this.logger.info(...args);
	}

	error(...args: unknown[]): void {
		this.logger.error(...args);
	}

	warn(...args: unknown[]): void {
		this.logger.warn(...args);
	}
}
