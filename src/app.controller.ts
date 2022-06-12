import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
    constructor() {}

    @Get()
    getHello(): string {
        return "Hello, stranger! This is the beginning of TraineeSQD API!";
    }
}
