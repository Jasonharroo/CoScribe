from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi import Depends, Request, status, Form
from sqlmodel import Session
from app.dependencies import SessionDep
from . import api_router
from app.services.user_service import UserService
from app.repositories.user import UserRepository
from app.utilities.flash import flash
from app.schemas import UserResponse
from app.database import get_session

def get_user_repo(db: Session = Depends(get_session)):
    return UserRepository(db)

# API endpoint for listing users
@api_router.get("/users", response_model=list[UserResponse])
async def list_users(request: Request, db: SessionDep):
    user_repo = UserRepository(db)
    user_service = UserService(user_repo)
    return user_service.get_all_users()

@api_router.get("/search")
def search_users(
    query: str,
    page: int = 1,
    limit: int = 10,
    repo: UserRepository = Depends(get_user_repo),
):
    users, pagination = repo.search_users(query, page, limit)
    return users