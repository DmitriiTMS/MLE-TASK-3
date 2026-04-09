import { beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function setupTestDatabase() {
    console.log('\n🔄 Setting up test database...');
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('❌ DATABASE_URL is not defined!');
    }
    
    try {
        console.log('📦 Pushing database schema...');
        execSync('npx prisma db push --force-reset', {
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: dbUrl }
        });
        console.log('✅ Database schema created');
        
        await prisma.$connect();
        console.log('✅ Connected to database');
    } catch (error) {
        console.error('❌ Failed to setup test database:', error);
        throw error;
    }
}

beforeAll(async () => {
    await setupTestDatabase();
}, 60000);

afterAll(async () => {
    await prisma.$disconnect();
});