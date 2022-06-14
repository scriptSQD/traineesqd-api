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
import { User } from "src/schemas/User.schema";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UpdateUserDTO } from "./dtos/User.dto";
import { UsersService } from "./users.service";
import { MongoIdDTO } from "src/dtos/MongoId.dto";

@Controller("users")
export class UsersController {
    constructor(private readonly us: UsersService) {}

    @Post("checkUsername")
    async checkUsername(@Body() body: { value: string }): Promise<boolean> {
        return await this.us.checkUsername(body.value);
    }
    @Post("checkEmail")
    async checkEmail(@Body() body: { value: string }): Promise<boolean> {
        return await this.us.checkEmail(body.value);
    }

    @UseGuards(JwtAuthGuard)
    @Get("me")
    async getMe(@Request() req: { user: User }): Promise<User> {
        return await this.us.getById(req.user._id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(":id")
    async getById(@Param() params: MongoIdDTO): Promise<User> {
        return await this.us.getById(params.id);
    }

    @UseGuards(JwtAuthGuard)
    @Put(":id")
    async updateById(@Param() params: MongoIdDTO, @Body() body: UpdateUserDTO) {
        return await this.us.updateById(params.id, body);
    }
}
