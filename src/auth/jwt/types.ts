export interface TokenPayload {
    email: string;
}

export interface TokensPair {
    accessToken: string;
    refreshToken: string;
}

export interface DecodedToken {
    email: string;
    iat: number;
    exp: number;
}