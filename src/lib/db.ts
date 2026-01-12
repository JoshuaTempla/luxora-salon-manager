import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create Prisma adapter with better-sqlite3 (using url format)
const adapter = new PrismaBetterSqlite3({
    url: "file:prisma/dev.db"
});

export const prisma = 
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

//helper function to safely disconnect Prisma
export async function disconnectDB(){
    await prisma.$disconnect();
}

//helper function to check database connection
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
