import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface AuthUser {
  userId: string
  email: string
  name: string
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    }
  } catch (error) {
    return null
  }
}

export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await getAuthUser(request)
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    return handler(request, user)
  }
}
