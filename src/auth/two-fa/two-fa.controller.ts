import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
} from "@nestjs/common";
import { IsString } from "class-validator";
import { User } from "src/schemas/User.schema";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { TwoFaService } from "./two-fa.service";

class TwoFaRegBody {
    @IsString()
    token: string;
}

@Controller("2fa")
export class TwoFaController {
    constructor(private readonly tfa: TwoFaService) {}

    @UseGuards(JwtAuthGuard)
    @Get("getUri")
    getAppQr(@Request() req: { user: User }): {
        encryptedHexified: string;
        iv: string;
    } {
        return this.tfa.getAppUri(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Post("register")
    async registerForUserById(
        @Request() req: { user: User },
        @Body() body: TwoFaRegBody,
    ): Promise<boolean> {
        return await this.tfa.registerTwoFa(req.user, body.token);
    }
}
