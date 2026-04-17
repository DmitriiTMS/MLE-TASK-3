import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class ExecutorIdUserDto {
	@IsInt({ message: 'Поле [executorUserId] должно быть целым числом' })
	@IsPositive({ message: 'Поле [executorUserId] должно быть положительным числом' })
	@IsNotEmpty({ message: 'Поле [executorUserId] не может быть пустым' })
	executorUserId: number;
}
