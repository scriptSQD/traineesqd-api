import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { from, Observable, of, switchMap } from "rxjs";
import { Todo } from "src/schemas/todo.schema";
import { User } from "src/schemas/user.schema";
import { TodoDTO } from "./dtos/todo.dto";
import { ITodo } from "./interfaces/todo.interface";

@Injectable()
export class TodosService {
    constructor(
        @InjectModel(Todo.name) private readonly todosModel: Model<Todo>,
    ) {}

    private checkIfUserIsOwner(user: User, userId: string): void {
        if (user._id !== userId)
            throw new HttpException("Not an owner.", HttpStatus.FORBIDDEN);
    }

    getAllByUserId(userId: string): Observable<ITodo[] | null> {
        return from(this.todosModel.find({ user: userId }).exec()).pipe(
            switchMap((todos) => {
                return of(todos.map((todo) => todo.toObject<ITodo>()));
            }),
        );
    }

    getById(id: string, user: User): Observable<ITodo> {
        return from(this.todosModel.findById(id).exec()).pipe(
            switchMap((todo) => {
                this.checkIfUserIsOwner(user, todo.user);
                return of(todo.toObject());
            }),
        );
    }

    createOne(todo: TodoDTO, userId: string): Observable<ITodo> {
        const newTodo = new this.todosModel({ ...todo, user: userId });

        return from(newTodo.save()).pipe(
            switchMap((res) => {
                return of(res.toObject());
            }),
        );
    }

    updateById(
        id: string,
        updated: Partial<TodoDTO>,
        user: User,
    ): Observable<boolean> {
        return from(this.todosModel.findById(id)).pipe(
            switchMap((todo) => {
                this.checkIfUserIsOwner(user, todo.user);
                return from(
                    this.todosModel.updateOne({ _id: id }, updated).exec(),
                );
            }),
            switchMap((res) => {
                return of(res.modifiedCount !== 0);
            }),
        );
    }

    removeById(id: string, user: User): Observable<boolean> {
        return from(this.todosModel.findById(id)).pipe(
            switchMap((todo) => {
                this.checkIfUserIsOwner(user, todo.user);
                return from(this.todosModel.deleteOne({ _id: id }).exec());
            }),
            switchMap((res) => {
                return of(res.deletedCount !== 0);
            }),
        );
    }
}
