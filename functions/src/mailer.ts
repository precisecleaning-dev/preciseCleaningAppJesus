import { defineSecret } from 'firebase-functions/params';
import { createTransport } from 'nodemailer';
import type { EmailContent } from './emails';

// The crew app's own Secret Manager secrets (prefix CREW_). The web's SMTP_* secrets (used by its
// `sendmailqueue`) are never read here, so changing one never breaks the other. Loaded once with
// `firebase functions:secrets:set CREW_SMTP_HOST` (and the others), then redeploy.
const SMTP_HOST = defineSecret('CREW_SMTP_HOST');
const SMTP_PORT = defineSecret('CREW_SMTP_PORT');
const SMTP_USER = defineSecret('CREW_SMTP_USER');
const SMTP_PASS = defineSecret('CREW_SMTP_PASS');
const SMTP_FROM = defineSecret('CREW_SMTP_FROM');

export const SMTP_SECRETS = [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM];

const DEFAULT_SMTP_PORT = 587;

/** Sends one email and returns its message id. Port 465 uses implicit TLS; 587 uses STARTTLS (Gmail). */
export const sendEmail = async (to: string, email: EmailContent): Promise<string> => {
    const port = Number(SMTP_PORT.value()) || DEFAULT_SMTP_PORT;
    const transporter = createTransport({
        host: SMTP_HOST.value(),
        port,
        secure: port === 465,
        auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() },
    });
    const info = await transporter.sendMail({ from: SMTP_FROM.value() || SMTP_USER.value(), to, subject: email.subject, html: email.html, text: email.text });
    return info.messageId;
};
