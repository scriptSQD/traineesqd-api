import { Body, Controller, Post } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { UserDTO } from "src/users/dtos/User.dto";
import { AuthService } from "./auth.service";
import { SanitizedUser } from "./models/SanitizedUser.model";

type JwtLogin = {
    user: SanitizedUser;
    jwt: string;
};

class LoginDTO {
    @IsString()
    username: string;
    @IsString()
    password: string;
    @IsOptional()
    @IsString()
    totp?: string;
}

@Controller("auth")
export class AuthController {
    constructor(private readonly as: AuthService) {}

    @Post("login")
    async login(@Body() body: LoginDTO): Promise<JwtLogin> {
        const payload = await this.as.validateCredentials(
            body.username,
            body.password,
            body.totp || undefined,
        );

        return this.as.signJwt(payload);
    }

    @Post("register")
    async register(@Body() body: UserDTO): Promise<JwtLogin> {
        const user = await this.as.register(body);
        return this.as.signJwt(user);
    }
}
