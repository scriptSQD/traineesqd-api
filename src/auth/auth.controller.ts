import { Body, Controller, Post } from "@nestjs/common";
import { User } from "schemas/User.schema";
import { UserDTO } from "src/users/dtos/User.dto";
import { AuthService } from "./auth.service";
import { SanitizedUser } from "./models/SanitizedUser.model";

type JwtLogin = {
    user: SanitizedUser;
    jwt: string;
};

@Controller("auth")
export class AuthController {
    constructor(private readonly as: AuthService) {}

    @Post("login")
    async login(
        @Body() body: { username: string; password: string },
    ): Promise<JwtLogin> {
        const payload = await this.as.validateCredentials(
            body.username,
            body.password,
        );

        return this.as.signJwt(payload);
    }

    @Post("register")
    async register(@Body() body: UserDTO): Promise<User> {
        return await this.as.register(body);
    }
}
