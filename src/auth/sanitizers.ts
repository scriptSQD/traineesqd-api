import { User } from "src/schemas/user.schema";
import { IResponseUser, ITokenizeUser } from "./models/sanitized.models";

export namespace Sanitizers {
    export function SanitizeForTokenize(user: User): ITokenizeUser {
        const { totpSecret, pwdResetToken, ...tokenizeUser } = user;
        return tokenizeUser;
    }

    export function SanitizeForResponse(
        user: ITokenizeUser | User,
    ): IResponseUser {
        if ((user as User).totpSecret || (user as User).pwdResetToken) {
            return SanitizeForResponse(SanitizeForTokenize(user as User));
        } else {
            const { password, ...responseUser } = user;
            return responseUser;
        }
    }
}
