import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { TodosModule } from "./todos/todos.module";

@Module({
    imports: [
        AuthModule,
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRoot(process.env.MONGO_URI, {
            dbName: process.env.DB_NAME || "TraineeSQD",
            retryWrites: true,
            w: "majority",
        }),
        UsersModule,
        TodosModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
