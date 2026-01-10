import { PrismaClient } from "@prisma/client";

//prismaCleint is attached to the 'global' object in develpmnt ot prevent
//exhausting the database connection limit
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = 
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'prodiction') globalForPrisma.prisma = prisma;

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
    