import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/schemas/User.schema";
import { UsersService } from "src/users/users.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrat } from "./strategies/jwt.strategy";
import { TwoFaModule } from "./two-fa/two-fa.module";

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: "1d",
            },
        }),
        MongooseModule.forFeature([
            {
                name: User.name,
                schema: UserSchema,
            },
        ]),
        TwoFaModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, UsersService, JwtStrat],
})
export class AuthModule {}
