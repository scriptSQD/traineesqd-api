import { Body, Controller, Post } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { from, Observable, of, switchMap } from "rxjs";
import { UserDTO } from "src/users/dtos/user.dto";
import { AuthService } from "./auth.service";
import { SanitizedUser } from "./models/SanitizedUser.model";

interface JwtLogin {
    user: SanitizedUser;
    jwt: string;
}

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
    constructor(private readonly authService: AuthService) {}

    @Post("login")
    login(@Body() body: LoginDTO): Observable<JwtLogin> {
        return from(
            this.authService.validateCredentials(
                body.username,
                body.password,
                body.totp || undefined,
            ),
        ).pipe(switchMap((user) => of(this.authService.signJwt(user))));
    }

    @Post("register")
    register(@Body() body: UserDTO): Observable<JwtLogin> {
        return from(this.authService.register(body)).pipe(
            switchMap((user) => of(this.authService.signJwt(user))),
        );
    }
}
