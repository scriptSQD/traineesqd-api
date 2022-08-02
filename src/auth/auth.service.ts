import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import { User } from "src/schemas/user.schema";
import { UserDTO } from "src/users/dtos/user.dto";

import * as a2 from "argon2";
import { SanitizedUser } from "./models/SanitizedUser.model";
import { authenticator } from "otplib";
import { catchError, from, Observable, of, switchMap } from "rxjs";

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) {}

    authenticate(
        identifier: string,
        password: string,
        totp?: string,
    ): Observable<User> {
        return this.usersService.getByIdentifier(identifier).pipe(
            switchMap((user) => {
                if (!user)
                    throw new HttpException(
                        "Invalid identifier or password.",
                        HttpStatus.BAD_REQUEST,
                    );

                return of(user);
            }),
            // Workaround to synchronously verify password
            switchMap((user) =>
                from(a2.verify(user.password, password)).pipe(
                    switchMap((pwdsMatch) => {
                        if (!pwdsMatch)
                            throw new HttpException(
                                "Invalid identifier or password.",
                                HttpStatus.BAD_REQUEST,
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
                        HttpStatus.UNAUTHORIZED,
                    );
                }

                if (user.hasTwoFa && !totp) {
                    throw new HttpException(
                        { totpCodeRequired: true },
                        HttpStatus.BAD_REQUEST,
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
                        HttpStatus.BAD_REQUEST,
                    );
                }

                return of(user);
            }),
        );
    }

    issueJwt(user: User): { user: SanitizedUser; jwt: string } {
        const { password, ...safeUserData } = user;

        return {
            user: safeUserData,
            jwt: this.jwtService.sign(
                { user },
                {
                    secret: process.env.JWT_SECRET,
                },
            ),
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
}
