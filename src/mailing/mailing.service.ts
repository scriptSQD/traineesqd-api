import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { from, Observable, of, switchMap } from "rxjs";
import * as SendGrid from "@sendgrid/mail";
import { readFileSync } from "fs";
import Handlebars from "handlebars";
import { join } from "path";
import { IResponseUser } from "src/auth/models/sanitized.models";

export interface EmailSentStatus {
    success?: boolean;
    invalidCredentials?: boolean;
}

@Injectable()
export class MailingService {
    constructor() {
        SendGrid.setApiKey(process.env.SENDGRID_API_KEY || "");
    }

    compileFromHandlebars(templateSource: string, hbsContext: {}): string {
        const hbs = Handlebars.compile(
            readFileSync(join(__dirname, templateSource), "binary"),
        );
        return hbs(hbsContext);
    }

    sendResetPasswordEmail(
        user: IResponseUser,
        link: string,
    ): Observable<EmailSentStatus> {
        const mail: SendGrid.MailDataRequired = {
            to: user.email,
            subject: "Password reset request for your TraineeSQD account.",
            from: {
                name: "TraineeSQD Staff",
                email: "staff@trainee.scriptsqd.dev",
            },
            html: this.compileFromHandlebars("templates/reset-password.hbs", {
                name: user.username,
                link,
            }),
        };

        return from(SendGrid.send(mail)).pipe(
            switchMap((resp) => {
                if (!resp) {
                    throw new HttpException(
                        { success: false },
                        HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                }

                return of({ success: true });
            }),
        );
    }
}
