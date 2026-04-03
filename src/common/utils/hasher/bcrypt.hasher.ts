import 'reflect-metadata';
import bcrypt from 'bcrypt';
import { inject, injectable } from 'inversify';
import { IPasswordHasher } from './hasher.interface';
import { TYPES } from '../../types/types';
import { IConfigService } from '../../config/config.service.interface';

@injectable()
export class BcryptHasher implements IPasswordHasher {
	constructor(@inject(TYPES.IConfigService) private readonly configService: IConfigService) {}

	async hash(plainTextPassword: string): Promise<string> {
		const hash_salt = Number(this.configService.get<string>('HASH_SALT'));
		const salt = await bcrypt.genSalt(hash_salt);
		return await bcrypt.hash(plainTextPassword, salt);
	}

	async compare(password: string, hashPassword: string): Promise<boolean> {
		return await bcrypt.compare(password, hashPassword);
	}
}
