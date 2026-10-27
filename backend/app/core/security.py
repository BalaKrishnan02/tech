import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Union
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with a unique random salt.
    Format: pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>
    """
    salt = secrets.token_hex(16)
    iterations = 100_000
    derived = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        iterations
    )
    return f"pbkdf2_sha256${iterations}${salt}${derived.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against the stored PBKDF2 hash.
    Constant-time comparison prevents timing attacks.
    """
    try:
        parts = hashed_password.split('$')
        if len(parts) != 4 or parts[0] != 'pbkdf2_sha256':
            return False
        iterations = int(parts[1])
        salt = parts[2]
        expected_hash = parts[3]
        
        derived = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            iterations
        )
        return hmac.compare_digest(derived.hex(), expected_hash)
    except Exception:
        return False

def create_access_token(subject: Union[str, Any], role: str = "analyst", expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed JWT access token.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a JWT token.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

def get_current_user_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> Dict[str, Any]:
    """
    FastAPI dependency requiring a valid JWT bearer token.
    Raises 401 if missing or invalid.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid credentials. Please re-authenticate.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return payload

def get_optional_user_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> Optional[Dict[str, Any]]:
    """
    FastAPI dependency for optional auth (e.g., guest / demo viewing mode).
    Returns user payload or None.
    """
    if not credentials or not credentials.credentials:
        return None
    return decode_access_token(credentials.credentials)

def verify_user_ownership(resource_owner_id: Optional[str], current_user: Dict[str, Any]):
    """
    Enforces authorization check: verifies current user owns the resource or is admin.
    Prevents Insecure Direct Object References (IDOR).
    """
    if not resource_owner_id:
        # Public or system-seeded resource
        return True
    
    user_id = current_user.get("sub")
    role = current_user.get("role", "analyst")
    
    if role == "admin":
        return True
    
    if resource_owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to access or modify this resource."
        )
    return True
