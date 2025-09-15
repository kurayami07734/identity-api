from enum import StrEnum
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel

from src.utils import get_utc_time


class LinkPrecedence(StrEnum):
    PRIMARY = "primary"
    SECONDARY = "secondary"


class Contact(SQLModel, table=True):
    __tablename__ = "contacts"

    id: Optional[int] = Field(default=None, primary_key=True)

    phone_number: Optional[str] = Field(default=None, index=True)
    email: Optional[str] = Field(default=None, index=True)

    # A self-referencing foreign key to link contacts. This points to the 'id' of the primary contact.
    linked_id: Optional[int] = Field(default=None, foreign_key="contacts.id")

    link_precedence: LinkPrecedence

    created_at: datetime = Field(default_factory=get_utc_time, nullable=False)
    updated_at: datetime = Field(
        default_factory=get_utc_time,
        sa_column_kwargs={"onupdate": get_utc_time},
        nullable=False,
    )

    deleted_at: Optional[datetime] = Field(default=None)
