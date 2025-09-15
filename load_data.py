from sqlmodel import SQLModel, Session, create_engine

from src.models import Contact, LinkPrecedence


mock_engine = create_engine("sqlite:///database.db", echo=True)

SQLModel.metadata.create_all(mock_engine)


def main():
    with Session(mock_engine, expire_on_commit=False) as session:
        lorraine = Contact(
            phone_number="123456",
            email="lorraine@hillvalley.edu",
            link_precedence=LinkPrecedence.PRIMARY,
        )

        session.add(lorraine)
        session.commit()

        mcfly = Contact(
            phone_number="123456",
            email="mcfly@hillvalley.edu",
            linked_id=lorraine.id,
            link_precedence=LinkPrecedence.SECONDARY,
        )
        george = Contact(
            phone_number="919191",
            email="george@hillvalley.edu",
            link_precedence=LinkPrecedence.PRIMARY,
        )
        biff = Contact(
            phone_number="717171",
            email="biffsucks@hillvalley.edu",
            link_precedence=LinkPrecedence.PRIMARY,
        )

        session.bulk_save_objects([mcfly, george, biff])
        session.commit()


if __name__ == "__main__":
    main()
