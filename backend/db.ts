// @ts-types="../prisma/client/index.d.ts"
import { PrismaClient } from '../prisma/client/index.js'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare const globalThis: {
    prisma: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prisma ?? prismaClientSingleton()

export const db = prisma

globalThis.prisma = prisma