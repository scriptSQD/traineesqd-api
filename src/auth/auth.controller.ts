import { Body, Controller, Post } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { Observable, of, switchMap } from "rxjs";
import { UserDTO } from "src/users/dtos/user.dto";
import { AuthService } from "./auth.service";
import { SanitizedUser } from "./models/SanitizedUser.model";

interface JwtLogin {
    user: SanitizedUser;
    jwt: string;
}

class LoginDTO {
    @IsString()
    identifier: string;

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
        return this.authService
            .authenticate(
                body.identifier,
                body.password,
                body.totp || undefined,
            )
            .pipe(switchMap((user) => of(this.authService.issueJwt(user))));
    }

    @Post("register")
    register(@Body() body: UserDTO): Observable<JwtLogin> {
        return this.authService
            .register(body)
            .pipe(switchMap((user) => of(this.authService.issueJwt(user))));
    }
}
