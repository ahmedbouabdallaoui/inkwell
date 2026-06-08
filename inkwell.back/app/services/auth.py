import httpx
from jose import jwk, jwt
from jose.utils import base64url_decode
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.user import User


class CognitoJWKS:
    def __init__(self):
        self._keys: list[dict] | None = None

    async def get_keys(self) -> list[dict]:
        if self._keys is not None:
            return self._keys
        url = f"https://cognito-idp.{settings.cognito_region}.amazonaws.com/{settings.cognito_user_pool_id}/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            resp.raise_for_status()
            self._keys = resp.json()["keys"]
        return self._keys

    def invalidate(self):
        self._keys = None


jwks = CognitoJWKS()


async def verify_cognito_token(token: str) -> dict:
    headers = jwt.get_unverified_headers(token)
    kid = headers.get("kid")
    keys = await jwks.get_keys()
    key = next((k for k in keys if k["kid"] == kid), None)
    if not key:
        raise ValueError("Invalid token: key not found")

    public_key = jwk.construct(key)
    message, encoded_sig = token.rsplit(".", 1)
    decoded_sig = base64url_decode(encoded_sig.encode("ascii"))

    if not public_key.verify(message.encode(), decoded_sig):
        raise ValueError("Invalid token: signature mismatch")

    claims = jwt.get_unverified_claims(token)
    if claims.get("token_use") != "id":
        raise ValueError("Invalid token: not an id token")

    return claims


async def get_or_create_user(db: AsyncSession, claims: dict) -> User:
    cognito_sub = claims["sub"]
    result = await db.execute(select(User).where(User.cognito_sub == cognito_sub))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            cognito_sub=cognito_sub,
            email=claims.get("email", ""),
            name=claims.get("name", ""),
        )
        db.add(user)
        await db.flush()
    return user
