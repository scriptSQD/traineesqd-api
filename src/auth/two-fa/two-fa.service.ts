import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { authenticator } from "otplib";
import { User } from "src/schemas/user.schema";
import * as CryptoJS from "crypto-js";
import { catchError, from, map, Observable, of, switchMap } from "rxjs";

@Injectable()
export class TwoFaService {
    constructor(
        @InjectModel(User.name) private readonly usersRepo: Model<User>,
    ) {}

    getAppUri(
        user: User,
    ): Observable<{ encryptedHexified: string; iv: string }> {
        const otpSecret = authenticator.generateSecret();

        const uri = authenticator.keyuri(
            user.username,
            "TraineeSQD",
            otpSecret,
        );
        const enc = CryptoJS.AES.encrypt(uri, process.env.CIPHER_KEY);

        return from(
            this.usersRepo
                .updateOne({ _id: user._id }, { totpSecret: otpSecret })
                .exec(),
        ).pipe(
            switchMap(() => {
                return of({
                    encryptedHexified: enc.toString(),
                    iv: enc.iv.toString(),
                });
            }),
            catchError((err) => {
                throw new HttpException(
                    {
                        message: "Error while registering 2FA.",
                        error: err,
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }),
        );
    }

    registerTwoFa(user: User, token: string): Observable<boolean> {
        const { _id: userid } = user;

        return from(
            this.usersRepo
                .findOne({ _id: userid })
                .select("+totpSecret")
                .exec(),
        ).pipe(
            switchMap((usr) => {
                if (!usr)
                    throw new HttpException(
                        "User, associated with this token, does not exist.",
                        HttpStatus.BAD_REQUEST,
                    );

                const verifyToken = authenticator.verify({
                    token: token,
                    secret: usr.totpSecret,
                });

                if (!verifyToken)
                    throw new HttpException(
                        { message: "Invalid OTP code." },
                        HttpStatus.BAD_REQUEST,
                    );

                return from(
                    this.usersRepo
                        .updateOne({ _id: userid }, { hasTwoFa: true })
                        .exec(),
                ).pipe(
                    catchError(() => {
                        throw new HttpException(
                            "Failed to update user's profile.",
                            HttpStatus.INTERNAL_SERVER_ERROR,
                        );
                    }),
                );
            }),
            map(() => {
                return true;
            }),
        );
    }
}
