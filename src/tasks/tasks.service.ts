import 'reflect-metadata';
import { injectable } from "inversify";
import { ITasksService } from './tasks.service.interface';

@injectable()
export class TasksService implements ITasksService {}