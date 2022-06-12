import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "schemas/User.schema";
import { UpdateUserDTO, UserDTO } from "./dtos/User.dto";

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private readonly usrModel: Model<User>,
    ) {}

    async getById(id: string): Promise<User> {
        const user = await this.usrModel.findById(id).exec();
        let converted = user.toObject();
        delete converted.password;
        return converted;
    }

    async getByUsername(username: string): Promise<User> {
        return await this.usrModel.findOne({ username: username }).exec();
    }

    async create(user: UserDTO): Promise<User> {
        const newUser = new this.usrModel(user);
        return await newUser.save();
    }

    async updateById(id: number, upd: UpdateUserDTO) {
        return await this.usrModel.updateOne({ id: id }, upd);
    }
}
