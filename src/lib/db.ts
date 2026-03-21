import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbUrl = process.env.DATABASE_URL ?? 'file:/app/data/prod.db';

const adapter = new PrismaBetterSqlite3({
    url: dbUrl
});

export const prisma = 
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function disconnectDB(){
    await prisma.$disconnect();
}

export async function checkDBConnection() {
    try{
        await prisma.$connect();
        console.log('Database connected successfully');
        return true;
    }catch(error){
        console.log('Database connection failed:', error);
        return false;
    }
}

export default prisma;