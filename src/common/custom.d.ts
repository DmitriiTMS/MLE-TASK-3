import { DecodedToken } from '../auth/jwt/types'

declare global {
    namespace Express {
        interface Request {
            user?: DecodedToken;
        }
    }
}

export { };