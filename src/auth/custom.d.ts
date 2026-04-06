import { DecodedToken } from './jwt/types'

declare global {
    namespace Express {
        interface Request {
            user?: DecodedToken;
        }
    }
}

export { };