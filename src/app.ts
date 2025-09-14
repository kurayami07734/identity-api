import express from 'express'
import { db } from '.'
import { contactTable } from './db/schema'
import { eq, isNull, or, and, sql } from 'drizzle-orm'

const app = express()

app.use(express.json())

app.get('/', (_, res) => {
    res.status(200).json({ "hello": "world" });
})

app.post('/identify', async (req, res) => {
  const { email, phoneNumber } = req.body;
  
  if (!email && !phoneNumber) {
    return res.status(400).json({ error: 'Email or phoneNumber required' });
  }

  try {
    // Find existing contacts
    const existing = await db
      .select()
      .from(contactTable)
      .where(
        and(
          isNull(contactTable.deletedAt),
          or(
            email ? eq(contactTable.email, email) : undefined,
            phoneNumber ? eq(contactTable.phoneNumber, phoneNumber) : undefined
          )
        )
      );

    if (existing.length === 0) {
      // No matches - create new primary
      const [newContact] = await db
        .insert(contactTable)
        .values({
          email: email || null,
          phoneNumber: phoneNumber || null,
          linkedId: null,
          linkPrecedence: 'primary'
        })
        .returning();

      return res.json({
        contact: {
          primaryContactId: newContact.id,
          emails: newContact.email ? [newContact.email] : [],
          phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
          secondaryContactIds: []
        }
      });
    }

    // Get primary contact IDs
    const primaryIds = new Set<number>();
    for (const contact of existing) {
      if (contact.linkPrecedence === 'primary') {
        primaryIds.add(contact.id);
      } else if (contact.linkedId) {
        primaryIds.add(contact.linkedId);
      }
    }

    let finalPrimaryId: number;

    if (primaryIds.size > 1) {
      // Multiple primaries - merge them
      const primaries = await db
        .select()
        .from(contactTable)
        .where(or(...Array.from(primaryIds).map(id => eq(contactTable.id, id))));

      // Oldest becomes primary
      primaries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      finalPrimaryId = primaries[0].id;

      // Convert others to secondary
      for (const primary of primaries.slice(1)) {
        await db
          .update(contactTable)
          .set({
            linkPrecedence: 'secondary',
            linkedId: finalPrimaryId,
            updatedAt: sql`CURRENT_TIMESTAMP`
          })
          .where(eq(contactTable.id, primary.id));

        // Update their secondaries too
        await db
          .update(contactTable)
          .set({
            linkedId: finalPrimaryId,
            updatedAt: sql`CURRENT_TIMESTAMP`
          })
          .where(eq(contactTable.linkedId, primary.id));
      }
    } else {
      finalPrimaryId = Array.from(primaryIds)[0];
    }

    // Check if we need to create a secondary
    const allInGroup = await db
      .select()
      .from(contactTable)
      .where(
        and(
          isNull(contactTable.deletedAt),
          or(
            eq(contactTable.id, finalPrimaryId),
            eq(contactTable.linkedId, finalPrimaryId)
          )
        )
      );

    // Check if exact combination exists
    const exactMatch = allInGroup.find(c => 
      c.email === (email || null) && c.phoneNumber === (phoneNumber || null)
    );

    if (!exactMatch) {
      // Check if we have new info
      const hasNewEmail = email && !allInGroup.some(c => c.email === email);
      const hasNewPhone = phoneNumber && !allInGroup.some(c => c.phoneNumber === phoneNumber);

      if (hasNewEmail || hasNewPhone) {
        await db
          .insert(contactTable)
          .values({
            email: email || null,
            phoneNumber: phoneNumber || null,
            linkedId: finalPrimaryId,
            linkPrecedence: 'secondary'
          });
      }
    }

    // Build response
    const updatedGroup = await db
      .select()
      .from(contactTable)
      .where(
        and(
          isNull(contactTable.deletedAt),
          or(
            eq(contactTable.id, finalPrimaryId),
            eq(contactTable.linkedId, finalPrimaryId)
          )
        )
      );

    const primary = updatedGroup.find(c => c.id === finalPrimaryId);
    const secondaries = updatedGroup.filter(c => c.id !== finalPrimaryId);

    const emails = [primary, ...secondaries]
      .map(c => c?.email)
      .filter(Boolean);
    
    const phoneNumbers = [primary, ...secondaries]
      .map(c => c?.phoneNumber)
      .filter(Boolean);

    res.json({
      contact: {
        primaryContactId: finalPrimaryId,
        emails: [...new Set(emails)],
        phoneNumbers: [...new Set(phoneNumbers)],
        secondaryContactIds: secondaries.map(c => c.id)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(3000, () => {
    console.log('running app on 3000')
});
