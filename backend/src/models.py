from sqlalchemy.orm import declarative_base, Mapped, mapped_column
from sqlalchemy import Integer,String

Base = declarative_base()

class Item(Base):
    __tablename__="items"
    id:Mapped[int]=mapped_column(Integer,primary_key=True,autoincrement=True)
    name:Mapped[str]=mapped_column(String(255),nullable=False)
