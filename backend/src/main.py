from fastapi import FastAPI, HTTPException, APIRouter
from pydantic import BaseModel
from sqlalchemy import select, func
from db import SessionLocal, ping_db, engine
from models import Base, Item

app = FastAPI(
    title="Projet Docker Demo",
    version="1.0.0",
    docs_url="/api/docs",          # <- ici
    openapi_url="/api/openapi.json",  # <- et ici
    redoc_url=None,
)


# --- DB bootstrap au démarrage ---
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    # seed minimal si vide
    with SessionLocal() as s:
        count = s.scalar(select(func.count(Item.id)))
        if not count:
            s.add_all([Item(name=n) for n in ["alpha", "bravo", "charlie", "delta"]])
            s.commit()

router = APIRouter(prefix="/api")

@router.get("/health")
def health():
    return {"status": "ok" if ping_db() else "degraded"}

@router.get("/")
def api_root():
    return {"message": "Backend up. See /api/health and /api/items"}

class ItemIn(BaseModel):
    name: str

@router.get("/items")
def list_items():
    with SessionLocal() as s:
        items = s.scalars(select(Item)).all()
        return [{"id": i.id, "name": i.name} for i in items]

@router.post("/items", status_code=201)
def create_item(payload: ItemIn):
    name = payload.name.strip()
    if not name:
        raise HTTPException(400, "name required")
    with SessionLocal() as s:
        item = Item(name=name)
        s.add(item)
        s.commit()
        s.refresh(item)
        return {"id": item.id, "name": item.name}

# --- NOUVEAU : renvoie un item aléatoire depuis la DB ---
@router.get("/items/random")
def random_item():
    with SessionLocal() as s:
        obj = s.scalars(select(Item).order_by(func.random()).limit(1)).first()
        if not obj:
            raise HTTPException(404, "no items in database")
        return {"id": obj.id, "name": obj.name}

app.include_router(router)
