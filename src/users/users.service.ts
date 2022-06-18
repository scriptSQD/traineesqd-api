import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, UpdateQuery } from "mongoose";
import { from, Observable, of, switchMap } from "rxjs";
import { User } from "src/schemas/user.schema";
import { UserDTO } from "./dtos/user.dto";

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>,
    ) {}

    getById(id: string): Observable<User> {
        return from(this.userModel.findById(id).exec()).pipe(
            switchMap((usr) => {
                return of(usr.toObject<User>());
            }),
        );
    }

    getByUsername(username: string): Observable<User> {
        return from(
            this.userModel
                .findOne({ username: username })
                .select("+password")
                .select("+totpSecret")
                .exec(),
        ).pipe(
            switchMap((usr) => {
                if (!usr)
                    throw new HttpException(
                        "Invalid username.",
                        HttpStatus.BAD_REQUEST,
                    );
                else return of(usr.toObject<User>());
            }),
        );
    }

    create(user: UserDTO): Observable<User> {
        const newUser = new this.userModel(user);

        return from(newUser.save()).pipe(
            switchMap((usr) => {
                return of(usr.toObject<User>());
            }),
        );
    }

    updateById(id: string, upd: UpdateQuery<User>): Observable<any> {
        return from(this.userModel.updateOne({ _id: id }, upd));
    }

    checkUsername(username: string): Observable<boolean> {
        return from(this.userModel.findOne({ username: username })).pipe(
            switchMap((usr) => {
                return of(!usr);
            }),
        );
    }
    checkEmail(email: string): Observable<boolean> {
        return from(this.userModel.findOne({ email: email })).pipe(
            switchMap((usr) => {
                return of(!usr);
            }),
        );
    }
}
