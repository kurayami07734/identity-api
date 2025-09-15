from fastapi import Body, Depends, FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from sqlmodel import Session, or_, select

from src.dependencies import get_session
from src.models import Contact, IdentifyRequest, IdentifyResponse, LinkPrecedence


app = FastAPI(title="Identity Reconciliation Task", description="")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/health")
async def health():
    return {"health": "ok"}


@app.post("/identify", response_model=IdentifyResponse)
def handle_identify_route(
    payload: IdentifyRequest = Body(...), session: Session = Depends(get_session)
):
    if payload.email is None and payload.phoneNumber is None:
        raise HTTPException(
            400, detail={"message": "email and phone number are both null!"}
        )

    if payload.email is not None and payload.phoneNumber is not None:
        condition = or_(
            Contact.email == payload.email,
            Contact.phone_number == payload.phoneNumber,
        )
    elif payload.email is not None:
        condition = Contact.email == payload.email
    else:
        condition = Contact.phone_number == payload.phoneNumber

    contacts = list(
        session.exec(
            select(Contact).where(condition).order_by(Contact.created_at)
        ).all()
    )

    if not contacts:
        # new contact
        contact = Contact(
            email=payload.email,
            phone_number=payload.phoneNumber,
            link_precedence=LinkPrecedence.PRIMARY,
        )

        session.add(contact)
        session.commit()

        emails = [contact.email] if contact.email else []
        phone_numbers = [contact.phone_number] if contact.phone_number else []

        return {
            "contact": {
                "emails": [],
                "phoneNumbers": [],
                "primaryContactId": contact.id,
                "secondaryContactIds": [],
            }
        }

    # update matching primary contacts
    oldest, *other_contacts = contacts

    contacts_to_update = [
        c for c in other_contacts if c.link_precedence == LinkPrecedence.PRIMARY
    ]

    updates = []

    for contact in contacts_to_update:
        contact.link_precedence = LinkPrecedence.SECONDARY
        contact.linked_id = oldest.id

        updates.append(contact)

    if updates:
        session.add_all(updates)
        session.commit()

    emails: list[str] = []
    phone_numbers: list[str] = []
    secondary_ids: list[int] = []
    primary_contact: Contact | None = None

    contacts = list(session.exec(select(Contact).where(condition)).all())

    for contact in contacts:
        if contact.email is not None:
            emails.append(contact.email)
        if contact.phone_number is not None:
            phone_numbers.append(contact.phone_number)

        if contact.link_precedence == LinkPrecedence.PRIMARY:
            primary_contact = contact
        else:
            secondary_ids.append(contact.id)

    if not primary_contact:
        raise HTTPException(500, detail={"message": "No primary contact found!"})

    return {
        "contact": {
            "emails": emails,
            "phoneNumbers": phone_numbers,
            "primaryContactId": primary_contact.id,
            "secondaryContactIds": secondary_ids,
        }
    }
