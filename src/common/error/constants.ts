export const HttpErrorCode = {
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	INTERNAL_SERVER_ERROR: 500,
	TOKEN_EXPIRED: 498,     
	TOKEN_INVALID: 498,      
	TOKEN_MISSING: 401,      
	TOKEN_REFRESH_FAILED: 401,
};

export const HttpErrorMessages = {
	[HttpErrorCode.BAD_REQUEST]: 'Некорректный запрос',
	[HttpErrorCode.UNAUTHORIZED]: 'Ошибка авторизации',
	[HttpErrorCode.FORBIDDEN]: 'Доступ запрещен',
	[HttpErrorCode.NOT_FOUND]: 'Ресурс не найден',
	[HttpErrorCode.CONFLICT]: 'Конфликт данных',
	[HttpErrorCode.INTERNAL_SERVER_ERROR]: 'Внутренняя ошибка сервера',
	[HttpErrorCode.TOKEN_EXPIRED]: 'Срок действия токена истек',
	[HttpErrorCode.TOKEN_INVALID]: 'Недействительный токен',
	[HttpErrorCode.TOKEN_MISSING]: 'Токен не предоставлен',
	[HttpErrorCode.TOKEN_REFRESH_FAILED]: 'Не удалось обновить токен',
};
