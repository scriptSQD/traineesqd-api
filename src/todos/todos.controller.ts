import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Req,
    UseGuards,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { MongoIdDTO } from "src/dtos/mongo-id.dto";
import { User } from "src/schemas/user.schema";
import { TodoDTO } from "./dtos/todo.dto";
import { ITodo } from "./interfaces/todo.interface";
import { TodosService } from "./todos.service";

@Controller("todos")
export class TodosController {
    constructor(private readonly todosService: TodosService) {}

    @UseGuards(JwtAuthGuard)
    @Get("mine")
    getMine(@Req() req: { user: User }): Observable<ITodo[]> {
        const userId = req.user._id;

        return this.todosService.getAllByUserId(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(":id")
    getById(
        @Param() params: MongoIdDTO,
        @Req() req: { user: User },
    ): Observable<ITodo> {
        return this.todosService.getById(params.id, req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    createOne(
        @Body() body: TodoDTO,
        @Req() request: { user: User },
    ): Observable<ITodo> {
        const userId = request.user._id;

        return this.todosService.createOne(body, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Put(":id")
    updateById(
        @Param() params: MongoIdDTO,
        @Body() body: Partial<TodoDTO>,
        @Req() req: { user: User },
    ): Observable<boolean> {
        return this.todosService.updateById(params.id, body, req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(":id")
    deleteById(
        @Param() params: MongoIdDTO,
        @Req() req: { user: User },
    ): Observable<boolean> {
        return this.todosService.removeById(params.id, req.user);
    }
}
