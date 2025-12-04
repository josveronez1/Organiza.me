import os
import jwt
from ninja.security import HttpBearer

class SupabaseAuth(HttpBearer):
    def authenticate(self, request, token):
        try:
            payload = jwt.decode(
                token,
                os.getenv('SUPABASE_JWT_SECRET'),
                algorithms=["HS256"],
                audience="authenticated"
            )
            return payload.get('sub')
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None