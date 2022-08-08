import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { Document } from "mongoose";
import { IResetToken } from "src/users/interfaces/resets.model";

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

    @Prop({ select: false, default: "" })
    totpSecret?: string;

    @Prop({ required: true, default: false })
    hasTwoFa: boolean;

    @Prop({ select: false, type: IResetToken })
    pwdResetToken: {
        token: string;
        expires: number;
    };
}

export const UserSchema = SchemaFactory.createForClass(User);
