import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-in-production';
const SALT_ROUNDS = 10;

//password hasing
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}


// JWT token generation and verification
export interface JWTPayload {
    userID: string;
    username: string;
    role: string;
}

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '7d', //token expires in 7 days
    });
}

export function verifyToken(token: string): JWTPayload | null {
    try{
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    }catch (error){
        console.error('Token verifcation failed', error);
        return null;
    }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !==2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
}