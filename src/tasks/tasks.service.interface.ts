import { TaskEntity } from "./entity/task.entity";
import { ICreateTaskData } from "./types";

export interface ITasksService {
    createTask(data: ICreateTaskData): Promise<TaskEntity>
}
