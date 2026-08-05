import { PrismaClient } from "../../generated/prisma/client"

const prismaClientSingleton = () => {
  return new (PrismaClient as any)() as PrismaClient
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof prismaClientSingleton> }

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
