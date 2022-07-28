import { IsBoolean, IsOptional, IsString } from "class-validator";

export class TodoDTO {
    @IsString()
    title: string;

    @IsOptional()
    @IsBoolean()
    completed?: boolean;
}
