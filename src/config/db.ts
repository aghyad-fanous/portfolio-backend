import { PrismaClient } from "../generated/prisma/client.js";

const prisma = new PrismaClient();

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL Connected via Prisma");
  } catch (error: any) {
    console.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default prisma;
