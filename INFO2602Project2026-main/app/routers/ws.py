from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import jwt

from sqlmodel import Session

from app.database import get_session
from app.config import get_settings
from app.repositories.user import UserRepository
from app.repositories.note import NoteRepository
from app.services.note_service import NoteService
from app.repositories.collab import CollaborationRepository
from app.services.collab_service import CollaborationService


router = APIRouter(tags=["WebSocket"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, note_id: int, websocket: WebSocket):
        await websocket.accept()
        if note_id not in self.active_connections:
            self.active_connections[note_id] = []
        self.active_connections[note_id].append(websocket)

    def disconnect(self, note_id: int, websocket: WebSocket):
        if note_id in self.active_connections:
            self.active_connections[note_id].remove(websocket)

    async def broadcast(self, note_id: int, message: dict, sender_ws: WebSocket):
        if note_id in self.active_connections:
            for connection in self.active_connections[note_id]:
                if connection != sender_ws: 
                    await connection.send_json(message)


manager = ConnectionManager()

async def get_user_from_ws(websocket: WebSocket, db: Session):
    token = websocket.cookies.get("access_token")

    if not token:
        await websocket.close(code=1008)
        return None

    try:
        payload = jwt.decode(
            token,
            get_settings().secret_key,
            algorithms=[get_settings().jwt_algorithm],
        )
        user_id = payload.get("sub")
    except Exception:
        await websocket.close(code=1008)
        return None

    repo = UserRepository(db)
    user = repo.get_by_id(user_id)

    if not user:
        await websocket.close(code=1008)
        return None

    return user


def user_can_access_note(db: Session, user_id: int, note) -> bool:
    if note.owner_id == user_id:
        return True

    collab_repo = CollaborationRepository(db)
    collab_service = CollaborationService(collab_repo)

    accepted = collab_service.get_accepted_collaboration(user_id, note.id)
    return accepted is not None


@router.websocket("/ws/notes/{note_id}")
async def websocket_note(
    websocket: WebSocket,
    note_id: int,
    db: Session = Depends(get_session),
):
    user = await get_user_from_ws(websocket, db)
    if not user:
        return

    note_service = NoteService(NoteRepository(db))
    note = note_service.get_note(note_id)

    if not note:
        await websocket.close(code=1008)
        return

    if not user_can_access_note(db, user.id, note):
        await websocket.close(code=1008)
        return

    await manager.connect(note_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            await manager.broadcast(note_id, {
                "type": "update",
                "content": data.get("content"),
                "title": data.get("title"),
                "sender": user.id,
            }, websocket)

    except WebSocketDisconnect:
        manager.disconnect(note_id, websocket)