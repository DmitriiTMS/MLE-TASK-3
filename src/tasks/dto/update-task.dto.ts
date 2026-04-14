import { TaskStatus } from '@prisma/client';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
} from 'class-validator';

export class UpdateTaskDto {
    @IsString({ message: 'Поле [title] должно быть строкой' })
    @MaxLength(100, { message: 'Поле [title] не должно превышать 100 символов' })
    @IsOptional()
    title: string;

    @IsString({ message: 'Поле [description] должно быть строкой' })
    @MaxLength(1000, { message: 'Поле [description] не должно превышать 100 символов' })
    @IsOptional()
    description?: string;

    @IsDateString(
        {},
        {
            message:
                'Поле [dueDate] должно быть корректной датой в формате ISO 8601 (YYYY-MM-DD или YYYY-MM-DDTHH:mm:ss.sssZ)',
        },
    )
    @IsOptional()
    dueDate?: string;

    @IsEnum(TaskStatus, {
        message: 'Поле [status] должно быть одним из значений: CREATED, IN_PROGRESS, COMPLETED',
    })
    @IsOptional()
    status?: TaskStatus;

    @IsDateString(
        {},
        {
            message:
                'Поле [completedAt] должно быть корректной датой в формате ISO 8601 (YYYY-MM-DD или YYYY-MM-DDTHH:mm:ss.sssZ)',
        },
    )
    @IsOptional()
    completedAt?: string;

    @IsInt({ message: 'Поле [executorUserId] должно быть целым числом' })
    @IsPositive({ message: 'Поле [executorUserId] должно быть положительным числом' })
    @IsOptional()
    executorUserId?: number;
}
