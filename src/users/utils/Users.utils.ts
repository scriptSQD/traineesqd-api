import { SanitizedUser } from "src/auth/models/SanitizedUser.model";
import { User } from "src/schemas/User.schema";

export function SanitizeUser(user: User): SanitizedUser {
    delete user.password;
    return user;
}
