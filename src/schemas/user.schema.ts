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

    @Prop({ unique: true, required: true })
    email: string;

    @Prop({ required: true, select: false })
    password: string;

    @Prop({ select: false })
    totpSecret?: string;

    @Prop({ required: true, default: false })
    hasTwoFa: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
