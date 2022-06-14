import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { authenticator } from "otplib";
import { User } from "src/schemas/User.schema";
import * as CryptoJS from "crypto-js";

@Injectable()
export class TwoFaService {
    constructor(
        @InjectModel(User.name) private readonly usersRepo: Model<User>,
    ) {}

    getAppUri(user: User): { encryptedHexified: string; iv: string } {
        const uri = authenticator.keyuri(
            user.username,
            "TraineeSQD",
            process.env.OTP_SECRET,
        );
        const enc = CryptoJS.AES.encrypt(uri, process.env.CIPHER_KEY);

        return {
            encryptedHexified: enc.toString(),
            iv: enc.iv.toString(),
        };
    }

    async registerTwoFa(user: User, token: string): Promise<boolean> {
        const verifyToken = authenticator.verify({
            token: token,
            secret: process.env.OTP_SECRET,
        });
        if (!verifyToken)
            throw new HttpException(
                { message: "Invalid OTP code." },
                HttpStatus.BAD_REQUEST,
            );

        await this.usersRepo
            .updateOne(
                { _id: user._id },
                {
                    hasTwoFa: true,
                },
            )
            .exec();

        return true;
    }
}
