import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, verifyPassword } from '@/lib/auth'
import { z } from 'zod'
import jwt from 'jsonwebtoken'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Get user by email
    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Create response with cookie
    const response = NextResponse.json(
      { 
        message: 'Login successful', 
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      },
      { status: 200 }
    )

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
