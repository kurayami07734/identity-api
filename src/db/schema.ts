import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { InferInsertModel, InferSelectModel, relations, sql } from "drizzle-orm";


export const contactTable = sqliteTable("contacts", {
  id: int("id").primaryKey({ autoIncrement: true }),
  
  phoneNumber: text("phone_number"),
  email: text("email"),

  linkedId: int("linked_id"),
  
  linkPrecedence: text("link_precedence", {
    enum: ["primary", "secondary"],
  }).notNull(),
  
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
    
  deletedAt: text("deleted_at"),
});

export const contactRelations = relations(contactTable, ({ one, many }) => ({
  // A secondary contact has one primary contact
  // This defines the relationship for rows where 'linkedId' is NOT NULL
  primaryContact: one(contactTable, {
    fields: [contactTable.linkedId],
    references: [contactTable.id],
    relationName: 'primaryContact'
  }),
  
  // A primary contact can have many secondary contacts
  // This defines the inverse relationship
  secondaryContacts: many(contactTable, {
    relationName: 'primaryContact'
  }),
}));

export type Contact = InferSelectModel<typeof contactTable>;
export type NewContact = InferInsertModel<typeof contactTable>;