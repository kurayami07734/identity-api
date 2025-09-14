import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

import { contactTable } from './db/schema';

const client = createClient({ url: process.env.DB_FILE_NAME! });
const db = drizzle({ client });


async function main() {
    const lorraine: typeof contactTable.$inferInsert = {
        phoneNumber: "123456",
        email: "lorraine@hillvalley.edu",
        linkedId: null,
        linkPrecedence: "primary",
        deletedAt: null,
    };

    const mcfly: typeof contactTable.$inferInsert = {
        phoneNumber: "123456",
        email: "mcfly@hillvalley.edu",
        linkedId: 1,
        linkPrecedence: "secondary",
        deletedAt: null,
    };


    const george: typeof contactTable.$inferInsert = {
        phoneNumber: "919191",
        email: "george@hillvalley.edu",
        linkedId: null,
        linkPrecedence: "primary",
        deletedAt: null,
    };

    const biff: typeof contactTable.$inferInsert = {
        phoneNumber: "717171",
        email: "biffsucks@hillvalley.edu",
        linkedId: null,
        linkPrecedence: "primary",
        deletedAt: null,
    };


    await db.insert(contactTable).values([lorraine, mcfly, george, biff])
}


main();