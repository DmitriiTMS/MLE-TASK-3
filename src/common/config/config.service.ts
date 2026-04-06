import { inject, injectable } from 'inversify';
import { IConfigService } from './config.service.interface';
import { config, DotenvParseOutput } from 'dotenv';
import { ILogger } from '../logger/logger.interface';
import { TYPES } from '../types/types';

@injectable()
export class ConfigService implements IConfigService {
	private config: DotenvParseOutput;

	constructor(@inject(TYPES.ILogger) private readonly logger: ILogger) {
		const result = config();
		if (result.error) {
			this.logger.error('The .env file could not be read or is missing.');
			this.config = {} as DotenvParseOutput;
		} else {
			this.config = result.parsed as DotenvParseOutput;
		}
	}

	get<T = string>(key: string): T {
		const value = this.config[key];
		if (!value) {
			this.logger.warn(`Key ${key} not found in .env file`);
			return undefined as T;
		}
		return value as T;
	}
}
