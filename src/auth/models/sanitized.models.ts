export interface IResponseUser {
    _id: string;
    email: string;
    username: string;
    hasTwoFa: boolean;
}

export interface ITokenizeUser {
    _id: string;
    username: string;
    email: string;
    password: string;
    hasTwoFa: boolean;
}
