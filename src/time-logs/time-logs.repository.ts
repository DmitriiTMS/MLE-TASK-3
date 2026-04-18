import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../common/types/types';
import { PrismaService } from '../common/database/prisma.service';
import { ITimeLogsRepository } from './time-logs.repository.interface';

@injectable()
export class TimeLogsRepository implements ITimeLogsRepository {
    constructor(@inject(TYPES.PrismaService) private readonly prismaService: PrismaService) { }

}