import 'reflect-metadata';
import bcrypt from 'bcrypt';
import { injectable } from 'inversify';
import { IPasswordHasher } from './hasher.interface';


@injectable()
export class BcryptHasher implements IPasswordHasher {
    private readonly saltRounds: number;

    constructor() {
        //  this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
        this.saltRounds = 10
    }

    async hash(plainTextPassword: string): Promise<string> {
        const salt = await bcrypt.genSalt(this.saltRounds);
        return await bcrypt.hash(plainTextPassword, salt);
    }

    async compare(plainTextPassword: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(plainTextPassword, hash);
    }
}