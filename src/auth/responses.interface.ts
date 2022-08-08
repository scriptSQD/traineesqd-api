import { IResponseUser } from "./models/sanitized.models";

export interface JwtLoginResponse {
    user: IResponseUser;
    jwt: string;
}

export interface IPasswordResetVerificationResponse {
    user: IResponseUser;
    tokenValid: boolean;
}

export interface IPasswordResetResonse {
    success?: boolean;
    invalidCredentials?: boolean;
    invalidToken?: boolean;
}
