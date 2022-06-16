import { IsEmail, IsOptional, IsString } from "class-validator";

export class UserDTO {
    @IsOptional()
    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsString()
    username: string;
}
