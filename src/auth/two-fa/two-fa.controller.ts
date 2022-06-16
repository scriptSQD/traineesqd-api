import {
    Body,
    Controller,
    Get,
    Post,
    Request,
    UseGuards,
} from "@nestjs/common";
import { IsString, Matches } from "class-validator";
import { Observable } from "rxjs";
import { User } from "src/schemas/user.schema";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { TwoFaService } from "./two-fa.service";

class TwoFaRegBody {
    @IsString()
    @Matches(/^[0-9]{6}$/, { message: "Invalid OTP code." })
    token: string;
}

@Controller("2fa")
export class TwoFaController {
    constructor(private readonly tfa: TwoFaService) {}

    @UseGuards(JwtAuthGuard)
    @Get("getUri")
    getAppQr(@Request() req: { user: User }): Observable<{
        encryptedHexified: string;
        iv: string;
    }> {
        return this.tfa.getAppUri(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Post("register")
    registerForUserById(
        @Request() req: { user: User },
        @Body() body: TwoFaRegBody,
    ): Observable<boolean> {
        console.log("body:", body);
        return this.tfa.registerTwoFa(req.user, body.token);
    }
}
