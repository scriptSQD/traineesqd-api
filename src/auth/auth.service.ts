import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import { User } from "schemas/User.schema";
import { UserDTO } from "src/users/dtos/User.dto";

import * as a2 from "argon2";
import { SanitizedUser } from "./models/SanitizedUser.model";

@Injectable()
export class AuthService {
    constructor(
        private readonly us: UsersService,
        private readonly jwt_s: JwtService,
    ) {}

    async validateCredentials(
        username: string,
        password: string,
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

        return user;
    }

    signJwt(usr: User): { user: SanitizedUser; jwt: string } {
        const payload = { user: usr };
        return {
            user: { username: usr.username, email: usr.email, id: usr._id },
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

        let created = await this.us.create(user);
        delete created.password;

        return created;
    }
}
