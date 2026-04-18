import { TaskStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class StatusTaskDto {

    @IsEnum(TaskStatus, {
        message: 'Поле [status] должно быть одним из значений: CREATED, IN_PROGRESS, COMPLETED',
    })
    @IsNotEmpty({ message: 'Поле [status] не может быть пустым' })
    status: TaskStatus;
}
