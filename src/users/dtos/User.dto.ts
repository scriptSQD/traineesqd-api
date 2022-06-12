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

export class UpdateUserDTO extends UserDTO {
    @IsOptional()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    username: string;
}
