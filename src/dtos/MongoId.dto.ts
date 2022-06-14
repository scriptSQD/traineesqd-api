import { Matches } from "class-validator";

export class MongoIdDTO {
    @Matches(/^[0-9a-fA-F]{24}$/, {
        message: "id must be a valid mongodb ObjectId instance.",
    })
    id: string;
}
