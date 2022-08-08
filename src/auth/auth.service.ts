import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import { User } from "src/schemas/user.schema";
import { UserDTO } from "src/users/dtos/user.dto";

import * as a2 from "argon2";
import { ITokenizeUser } from "./models/sanitized.models";
import { authenticator } from "otplib";
import { catchError, from, Observable, of, switchMap } from "rxjs";
import { Sanitizers } from "./sanitizers";
import { EmailSentStatus, MailingService } from "src/mailing/mailing.service";
import {
    JwtLoginResponse,
    IPasswordResetVerificationResponse,
    IPasswordResetResonse,
} from "./responses.interface";

function Hours(h: number) {
    return 1000 * 60 * 60 * h;
}

function Minutes(m: number) {
    return 1000 * 60 * m;
}

@Injectable()
export class AuthService {
    passwordResetTokenLength = 32;
    basePwdResetLink =
        process.env.NODE_ENV === "production"
            ? "https://trainee.scriptsqd.dev/resetPassword?token="
            : "http://localhost:4200/resetPassword?token=";

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly mailingService: MailingService,
    ) {}

    authenticate(
        identifier: string,
        password: string,
        totp?: string,
    ): Observable<ITokenizeUser> {
        return this.usersService.getByIdentifier(identifier).pipe(
            switchMap((user) => {
                if (!user)
                    throw new HttpException(
                        { invalidCredentials: true },
                        HttpStatus.OK,
                    );

                return of(user);
            }),
            // Workaround to synchronously verify password
            switchMap((user) =>
                from(a2.verify(user.password, password)).pipe(
                    switchMap((pwdsMatch) => {
                        if (!pwdsMatch)
                            throw new HttpException(
                                { invalidCredentials: true },
                                HttpStatus.OK,
                            );

                        return of(user);
                    }),
                ),
            ),
            switchMap((user) => {
                if (user.hasTwoFa && !user.totpSecret) {
                    this.usersService
                        .updateById(user._id, {
                            hasTwoFa: false,
                            totpSecret: "",
                        })
                        .pipe(
                            catchError(() => {
                                throw new HttpException(
                                    "Could not disable 2FA.",
                                    HttpStatus.INTERNAL_SERVER_ERROR,
                                );
                            }),
                        );

                    throw new HttpException(
                        {
                            message:
                                "Two factor authentication is enabled but is broken. Resetting 2FA for this user.",
                            resetTwoFa: true,
                        },
                        HttpStatus.OK,
                    );
                }

                if (user.hasTwoFa && !totp) {
                    throw new HttpException(
                        { totpCodeRequired: true },
                        HttpStatus.OK,
                    );
                }

                if (
                    user.hasTwoFa &&
                    totp &&
                    !authenticator.verify({
                        token: totp,
                        secret: user.totpSecret,
                    })
                ) {
                    throw new HttpException(
                        "Invalid TOTP code.",
                        HttpStatus.OK,
                    );
                }

                return of(Sanitizers.SanitizeForTokenize(user));
            }),
        );
    }

    issueJwt(user: ITokenizeUser): JwtLoginResponse {
        return {
            user: Sanitizers.SanitizeForResponse(user),
            jwt: this.jwtService.sign(user, {
                secret: process.env.JWT_SECRET,
            }),
        };
    }

    register(user: UserDTO): Observable<User> {
        return from(
            a2.hash(user.password, {
                type: a2.argon2i,
            }),
        ).pipe(
            switchMap((hash) =>
                of({
                    ...user,
                    password: hash,
                }),
            ),
            switchMap((user) => this.usersService.create(user)),
            catchError(() => {
                throw new HttpException(
                    "Failed to create user in database.",
                    HttpStatus.BAD_REQUEST,
                );
            }),
        );
    }

    requestPasswordReset(identifier: string): Observable<EmailSentStatus> {
        return this.usersService.getByIdentifier(identifier).pipe(
            switchMap((user) => {
                if (!user) {
                    return of(undefined);
                }

                return this.usersService
                    .updateById(user._id, {
                        pwdResetToken: {
                            token: authenticator.generateSecret(
                                this.passwordResetTokenLength,
                            ),
                            expires: Date.now() + Hours(24),
                        },
                    })
                    .pipe(
                        switchMap((resp) => {
                            if (!resp) {
                                return of(undefined);
                            }

                            return this.usersService.getByIdentifier(
                                user.username,
                            );
                        }),
                    );
            }),
            switchMap((user) => {
                if (!user) {
                    return of({ success: false });
                }

                return this.mailingService.sendResetPasswordEmail(
                    user,
                    `${this.basePwdResetLink}${user.pwdResetToken.token}&username=${user.username}`,
                );
            }),
        );
    }

    verifyPasswordResetToken(
        token: string,
        username: string,
    ): Observable<IPasswordResetVerificationResponse> {
        return this.usersService.getByIdentifier(username).pipe(
            switchMap((user) => {
                if (!user) {
                    return of({ user: null, tokenValid: false });
                }

                if (
                    user.pwdResetToken?.token === token &&
                    user.pwdResetToken?.expires > Date.now()
                ) {
                    return of({
                        user: Sanitizers.SanitizeForResponse(user),
                        tokenValid: true,
                    });
                } else if (
                    user.pwdResetToken?.token === token &&
                    user.pwdResetToken?.expires < Date.now()
                ) {
                    return this.usersService
                        .updateById(user._id, {
                            pwdResetToken: undefined,
                        })
                        .pipe(
                            switchMap(() => {
                                return of({ user: null, tokenValid: false });
                            }),
                            catchError((err) => {
                                throw new HttpException(
                                    err,
                                    HttpStatus.INTERNAL_SERVER_ERROR,
                                );
                            }),
                        );
                } else {
                    return of({ user: null, tokenValid: false });
                }
            }),
        );
    }

    resetPassword(
        username: string,
        password: string,
    ): Observable<IPasswordResetResonse> {
        return this.usersService.getByIdentifier(username).pipe(
            switchMap((user) => {
                if (!user) {
                    return of(false);
                }

                return from(
                    a2.hash(password, {
                        type: a2.argon2i,
                    }),
                ).pipe(
                    switchMap((hash) => {
                        return this.usersService.updateById(user._id, {
                            password: hash,
                            pwdResetToken: null,
                        });
                    }),
                );
            }),
            switchMap((resp) => {
                if (!resp) {
                    return of({ success: false });
                }

                return of({ success: true });
            }),
        );
    }
}
