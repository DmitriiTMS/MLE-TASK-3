export const BASE_PREFIX = '/api';

export const HttpCodeSuccessful = {
	OK: 200,
	CREATED: 201,
	ACCEPTED: 202,
	NO_CONTENT: 204,
} as const;

export const HttpCodeSuccessfulMessages = {
	[HttpCodeSuccessful.OK]: 'OK',
	[HttpCodeSuccessful.CREATED]: 'Создан',
	[HttpCodeSuccessful.ACCEPTED]: 'Принято',
	[HttpCodeSuccessful.NO_CONTENT]: 'Нет содержимого',
} as const;
