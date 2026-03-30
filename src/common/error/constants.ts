export const HttpErrorCode = {
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	INTERNAL_SERVER_ERROR: 500,
} as const;

export const HttpErrorMessages = {
	[HttpErrorCode.BAD_REQUEST]: 'Некорректный запрос',
	[HttpErrorCode.UNAUTHORIZED]: 'Ошибка авторизации',
	[HttpErrorCode.FORBIDDEN]: 'Доступ запрещен',
	[HttpErrorCode.NOT_FOUND]: 'Ресурс не найден',
	[HttpErrorCode.CONFLICT]: 'Конфликт данных',
	[HttpErrorCode.INTERNAL_SERVER_ERROR]: 'Внутренняя ошибка сервера',
} as const;
