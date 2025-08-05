import { PrismaClient } from "@prisma/client";

// Singleton pattern:
const prisma = new PrismaClient();

export default prisma;