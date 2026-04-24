import { IsOptional, IsEnum, IsDateString, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export enum PeriodType {
	WEEK = 'week',
	MONTH = 'month',
	ALL = 'all',
}

export class GetDeveloperTimeLogsDto {
	@IsOptional()
	@IsEnum(PeriodType, { message: 'Параметр [period] может быть: week, month или all' })
	period?: PeriodType;

	@IsOptional()
	@ValidateIf((o) => !o.period || o.period === PeriodType.ALL)
	@IsDateString()
	startDate?: string | Date;

	@IsOptional()
	@ValidateIf((o) => !o.period || o.period === PeriodType.ALL)
	@IsDateString()
	endDate?: string | Date;

	@IsOptional()
	@Type(() => Number)
	projectId?: number;
}
