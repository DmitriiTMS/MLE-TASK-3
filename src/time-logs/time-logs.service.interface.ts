import { TaskStatus } from '@prisma/client';
import { TaskEntity } from '../tasks/entity/task.entity';

export interface ITimeLogsService {
	startWorkOnTask(task: TaskEntity, userId: number): Promise<void>;
	completeTask(task: TaskEntity, userId: number): Promise<void>;
}
