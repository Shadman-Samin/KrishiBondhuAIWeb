import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Kysely } from "kysely";
import { LibsqlDialect } from "@libsql/kysely-libsql";

let _auth: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (_auth) return _auth;

  const url = process.env.DATABASE_URL || "file:./auth.db";

  const database = new Kysely({
    dialect: new LibsqlDialect({ url }),
  });

  _auth = betterAuth({
    database,
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    plugins: [
      phoneNumber({
        sendOTP: ({ phoneNumber, code }) => {
          console.log(`[DEV] OTP for ${phoneNumber}: ${code}`);
        },
        signUpOnVerification: {
          getTempEmail: (phone) => `${phone.replace(/[^+\d]/g, "")}@kb.auth`,
        },
      }),
      tanstackStartCookies(),
    ],
  });

  return _auth;
}
