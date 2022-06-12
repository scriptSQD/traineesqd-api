import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { User } from "src/schemas/User.schema";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UpdateUserDTO } from "./dtos/User.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
    constructor(private readonly us: UsersService) {}

    @UseGuards(JwtAuthGuard)
    @Get(":id")
    async getById(@Param() params: { id: string }): Promise<User> {
        return await this.us.getById(params.id);
    }

    @UseGuards(JwtAuthGuard)
    @Put(":id")
    async updateById(
        @Param() params: { id: number },
        @Body() body: UpdateUserDTO,
    ) {
        return await this.us.updateById(params.id, body);
    }
}
