import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type TodoDoc = Todo & Document;

@Schema({
    collection: "Todos",
    versionKey: false,
})
export class Todo {
    _id: string;

    @Prop()
    title: string;

    @Prop({ default: false })
    completed: boolean;

    @Prop()
    user: string;
}

export const TodoSchema = SchemaFactory.createForClass(Todo);
