import {
    Body,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Post,
    Query,
} from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { Observable, of, switchMap } from "rxjs";
import { EmailSentStatus } from "src/mailing/mailing.service";
import { UserDTO } from "src/users/dtos/user.dto";
import { AuthService } from "./auth.service";
import {
    JwtLoginResponse,
    IPasswordResetVerificationResponse,
    IPasswordResetResonse,
} from "./responses.interface";

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
    login(@Body() body: LoginDTO): Observable<JwtLoginResponse> {
        return this.authService
            .authenticate(
                body.identifier,
                body.password,
                body.totp || undefined,
            )
            .pipe(switchMap((user) => of(this.authService.issueJwt(user))));
    }

    @Post("register")
    register(@Body() body: UserDTO): Observable<JwtLoginResponse> {
        return this.authService
            .register(body)
            .pipe(switchMap((user) => of(this.authService.issueJwt(user))));
    }

    @Get("resetPassword")
    requestPasswordReset(
        @Query("identifier") identifier: string,
    ): Observable<EmailSentStatus> {
        return this.authService.requestPasswordReset(identifier);
    }

    @Post("resetPassword")
    resetPassword(
        @Body() body: { token: string; username: string; password: string },
    ): Observable<IPasswordResetResonse> {
        return this.authService
            .verifyPasswordResetToken(body.token, body.username)
            .pipe(
                switchMap((resp) => {
                    if (!resp.tokenValid) {
                        throw new HttpException(
                            { invalidToken: true },
                            HttpStatus.OK,
                        );
                    }

                    return this.authService.resetPassword(
                        body.username,
                        body.password,
                    );
                }),
            );
    }

    @Get("resetPassword/verify")
    verifyPasswordResetToken(
        @Query() query: { token: string; username: string },
    ): Observable<IPasswordResetVerificationResponse> {
        return this.authService.verifyPasswordResetToken(
            query.token,
            query.username,
        );
    }
}
