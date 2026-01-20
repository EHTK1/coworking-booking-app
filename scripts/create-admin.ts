// scripts/create-admin.ts - CLI script to create first admin user

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/password';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdmin() {
  console.log('\n=== Create First Admin User ===\n');

  try {
    const name = await question('Admin name: ');
    const email = await question('Admin email: ');
    const password = await question('Admin password (min 8 chars): ');

    // Validate inputs
    if (!name || !email || !password) {
      console.error('Error: All fields are required');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('Error: Password must be at least 8 characters');
      process.exit(1);
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.error(`Error: User with email ${email} already exists`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log('\n✓ Admin user created successfully!');
    console.log('\nDetails:');
    console.log(`  Name: ${admin.name}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`\nYou can now login at /login\n`);
  } catch (error) {
    console.error('\nError creating admin:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdmin();
