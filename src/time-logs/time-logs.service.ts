import 'reflect-metadata';
import { injectable } from 'inversify';
import { ITimeLogsService } from './time-logs.service.interface';

@injectable()
export class TimeLogsService implements ITimeLogsService {
    constructor(
    ) { }
}
