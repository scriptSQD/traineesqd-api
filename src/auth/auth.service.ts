import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import { User } from "src/schemas/User.schema";
import { UserDTO } from "src/users/dtos/User.dto";

import * as a2 from "argon2";
import { SanitizedUser } from "./models/SanitizedUser.model";
import { authenticator } from "otplib";
import { SanitizeUser } from "src/users/utils/Users.utils";
import { create } from "domain";

@Injectable()
export class AuthService {
    constructor(
        private readonly us: UsersService,
        private readonly jwt_s: JwtService,
    ) {}

    async validateCredentials(
        username: string,
        password: string,
        totp?: string,
    ): Promise<User> {
        const user = await this.us.getByUsername(username);
        if (!user)
            throw new HttpException(
                { message: `User ${username} not found.` },
                HttpStatus.BAD_REQUEST,
            );

        const pwdsMatch = await a2.verify(user.password, password);
        if (!pwdsMatch)
            throw new HttpException(
                { message: `Wrong password for user ${username}.` },
                HttpStatus.BAD_REQUEST,
            );

        if (user.hasTwoFa) {
            if (!totp)
                throw new HttpException(
                    { totpCodeRequired: true },
                    HttpStatus.BAD_REQUEST,
                );

            if (
                !authenticator.verify({
                    token: totp,
                    secret: process.env.OTP_SECRET,
                })
            )
                throw new HttpException(
                    { message: "Incorrect OTP code." },
                    HttpStatus.BAD_REQUEST,
                );
        }

        return user;
    }

    signJwt(usr: User): { user: SanitizedUser; jwt: string } {
        const payload = { user: usr };
        return {
            user: usr,
            jwt: this.jwt_s.sign(payload, { secret: process.env.JWT_SECRET }),
        };
    }

    async register(user: UserDTO): Promise<User> {
        // rewrite user with hashed password
        user = {
            ...user,
            password: await a2.hash(user.password, {
                type: a2.argon2i,
            }),
        };

        let created = await this.us.create(user).catch((err) => {
            throw new HttpException(
                { message: "Error occured when creating user.", details: err },
                HttpStatus.BAD_REQUEST,
            );
        });

        return created;
    }
}
