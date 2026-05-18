from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()


async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    # Placeholder — real JWKS verification added in Task 4
    return {"sub": token, "email": "", "name": ""}


async def get_current_user(claims: dict = Depends(verify_token)) -> dict:
    return claims
