import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import { User } from "src/schemas/user.schema";
import { UserDTO } from "src/users/dtos/user.dto";

import * as a2 from "argon2";
import { SanitizedUser } from "./models/SanitizedUser.model";
import { authenticator } from "otplib";
import { catchError, from, Observable, of, switchMap, tap } from "rxjs";

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) {}

    validateCredentials(
        username: string,
        password: string,
        totp?: string,
    ): Observable<User> {
        return this.usersService.getByUsername(username).pipe(
            switchMap((user) => {
                if (!user)
                    throw new HttpException(
                        "Invalid username or password.",
                        HttpStatus.BAD_REQUEST,
                    );

                return of(user);
            }),
            // Workaround to sync verify password
            switchMap((user) => {
                return from(a2.verify(user.password, password)).pipe(
                    switchMap((pwdsMatch) => {
                        if (!pwdsMatch)
                            throw new HttpException(
                                "Invalid username or password.",
                                HttpStatus.BAD_REQUEST,
                            );

                        return of(user);
                    }),
                );
            }),
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
                        )
                        .subscribe();

                    throw new HttpException(
                        {
                            message:
                                "Two factor authentication is enabled but is broken. Resetting 2FA for this user.",
                            resetTwoFa: true,
                        },
                        HttpStatus.UNAUTHORIZED,
                    );
                } else if (user.hasTwoFa && !totp)
                    throw new HttpException(
                        { totpCodeRequired: true },
                        HttpStatus.BAD_REQUEST,
                    );
                else if (
                    user.hasTwoFa &&
                    totp &&
                    !authenticator.verify({
                        token: totp,
                        secret: user.totpSecret,
                    })
                )
                    throw new HttpException(
                        "Invalid TOTP code.",
                        HttpStatus.BAD_REQUEST,
                    );

                return of(user);
            }),
        );
    }

    signJwt(usr: User): { user: SanitizedUser; jwt: string } {
        const payload = { user: usr };

        const { password, ...sanUser } = usr;

        return {
            user: sanUser,
            jwt: this.jwtService.sign(payload, {
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
            switchMap((hash) => {
                return of({
                    ...user,
                    password: hash,
                });
            }),
            switchMap((user) => {
                return this.usersService.create(user);
            }),

            catchError(() => {
                throw new HttpException(
                    "Failed to create user in database.",
                    HttpStatus.BAD_REQUEST,
                );
            }),
        );
    }
}
