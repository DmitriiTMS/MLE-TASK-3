import 'reflect-metadata';
import { injectable } from "inversify";
import { ITasksRepository } from './tasks.reposotory.interface';

@injectable()
export class TasksRepository implements ITasksRepository { }