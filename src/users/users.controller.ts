import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Put,
    Request,
    UseGuards,
} from "@nestjs/common";
import { User } from "src/schemas/user.schema";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UsersService } from "./users.service";
import { MongoIdDTO } from "src/dtos/mongo-id.dto";
import { Observable } from "rxjs";
import { UpdateQuery } from "mongoose";

@Controller("users")
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post("checkUsername")
    checkUsername(@Body() body: { value: string }): Observable<boolean> {
        return this.usersService.checkUsername(body.value);
    }
    @Post("checkEmail")
    checkEmail(@Body() body: { value: string }): Observable<boolean> {
        return this.usersService.checkEmail(body.value);
    }

    @UseGuards(JwtAuthGuard)
    @Get("me")
    getMe(@Request() req: { user: User }): Observable<User> {
        return this.usersService.getById(req.user._id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(":id")
    getById(@Param() params: MongoIdDTO): Observable<User> {
        return this.usersService.getById(params.id);
    }

    @UseGuards(JwtAuthGuard)
    @Put(":id")
    updateById(
        @Param() params: MongoIdDTO,
        @Body() body: UpdateQuery<User>,
    ): Observable<any> {
        return this.usersService.updateById(params.id, body);
    }
}
