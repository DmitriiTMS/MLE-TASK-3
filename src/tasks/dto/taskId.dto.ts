import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class TaskIdDto {
	@IsString({ message: 'Параметр [taskId] должно быть строкой' })
	@Matches(/^\d+$/, { message: 'Параметр [taskId] должен содержать только цифры' })
	@IsNotEmpty({ message: 'Параметр [taskId] не может быть пустым' })
	taskId: string;
}
