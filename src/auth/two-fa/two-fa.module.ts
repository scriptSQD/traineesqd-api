import { Module } from "@nestjs/common";
import { TwoFaService } from "./two-fa.service";
import { TwoFaController } from "./two-fa.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/schemas/User.schema";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: User.name,
                schema: UserSchema,
            },
        ]),
    ],
    providers: [TwoFaService],
    controllers: [TwoFaController],
})
export class TwoFaModule {}
