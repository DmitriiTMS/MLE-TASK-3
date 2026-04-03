import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { TYPES } from '../types/types';
import { ILogger } from '../logger/logger.interface';

@injectable()
export class PrismaService {
	public client: PrismaClient;

	constructor(@inject(TYPES.ILogger) private readonly logger: ILogger) {
		this.client = new PrismaClient();
	}

	async connect(): Promise<void> {
		try {
			await this.client.$connect();
			this.logger.log('✅ Database connected successfully');
		} catch (error) {
			this.logger.error('❌ Database connection failed:', error);
			throw error;
		}
	}

	async disconnect(): Promise<void> {
		try {
			await this.client.$disconnect();
			this.logger.log('✅ Database disconnected successfully');
		} catch (error) {
			this.logger.error('❌ Error disconnecting from database:', error);
			throw error;
		}
	}
}
