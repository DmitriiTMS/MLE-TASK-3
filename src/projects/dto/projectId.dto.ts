import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ProjectIdDto {
	@IsString({ message: 'Параметр [projectId] должно быть строкой' })
	@Matches(/^\d+$/, { message: 'Параметр [projectId] должен содержать только цифры' })
	@IsNotEmpty({ message: 'Параметр [projectId] не может быть пустым' })
	projectId: number;
}
