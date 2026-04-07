export interface TokenPayload {
	userId: number;
	email: string;
}

export interface TokensPair {
	accessToken: string;
	refreshToken: string;
}

export interface DecodedToken {
	email: string;
	userId: number;
	iat: number;
	exp: number;
}
