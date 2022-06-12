import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDoc = User & Document;

@Schema({ collection: "Users", versionKey: false })
export class User {
    _id: string;

    @Prop({
        unique: true,
        required: true,
    })
    username: string;

    @Prop()
    email: string;

    @Prop({ required: true })
    password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
