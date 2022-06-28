import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Todo, TodoSchema } from "src/schemas/todo.schema";
import { TodosController } from "./todos.controller";
import { TodosService } from "./todos.service";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Todo.name,
                schema: TodoSchema,
            },
        ]),
    ],
    providers: [TodosService],
    controllers: [TodosController],
})
export class TodosModule {}
