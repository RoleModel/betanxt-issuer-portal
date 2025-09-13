import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import path from 'path';

test.describe('Database Migrations', () => {
  let prisma: PrismaClient;

  test.beforeAll(async () => {
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should generate Prisma client successfully', () => {
    // This test will fail initially until Prisma client is generated
    expect(() => {
      execSync('npx prisma generate', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'pipe',
      });
    }).not.toThrow();
  });

  test('should push schema to database successfully', async () => {
    // This test will fail initially until database is configured
    expect(() => {
      execSync('npx prisma db push --accept-data-loss', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      });
    }).not.toThrow();
  });

  test('should create all enum types in database', async () => {
    // This test will fail initially until database is set up
    const enums = await prisma.$queryRaw`
      SELECT enumtypid, enumlabel, typname
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      ORDER BY typname, enumsortorder
    ` as Array<{ typname: string; enumlabel: string }>;

    const enumTypes = [...new Set(enums.map(e => e.typname))];

    const requiredEnums = [
      'UserType',
      'MeetingStatus',
      'PhaseStatus',
      'TaskStatus',
      'DocumentStatus',
    ];

    requiredEnums.forEach(enumName => {
      expect(enumTypes).toContain(enumName);
    });
  });

  test('should have proper column types and constraints', async () => {
    // This test will fail initially until database is set up
    const columns = await prisma.$queryRaw`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    ` as Array<{
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }>;

    // Check for key columns and their types
    const accountIdColumn = columns.find(c =>
      c.table_name === 'accounts' && c.column_name === 'id'
    );
    expect(accountIdColumn?.data_type).toBe('uuid');
    expect(accountIdColumn?.is_nullable).toBe('NO');

    const meetingDateColumn = columns.find(c =>
      c.table_name === 'meetings' && c.column_name === 'meetingDate'
    );
    expect(meetingDateColumn?.data_type).toBe('date');
    expect(meetingDateColumn?.is_nullable).toBe('NO');

    const sharesColumn = columns.find(c =>
      c.table_name === 'positions' && c.column_name === 'shares'
    );
    expect(sharesColumn?.data_type).toBe('bigint');
    expect(sharesColumn?.is_nullable).toBe('NO');
  });

  test('should have unique constraints properly set', async () => {
    // This test will fail initially until database is set up
    const uniqueConstraints = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE'
      ORDER BY tc.table_name, tc.constraint_name
    ` as Array<{
      constraint_name: string;
      table_name: string;
      column_name: string;
    }>;

    // Check for required unique constraints
    const accountNameUnique = uniqueConstraints.find(c =>
      c.table_name === 'accounts' && c.column_name === 'name'
    );
    expect(accountNameUnique).toBeDefined();

    const userEmailUnique = uniqueConstraints.find(c =>
      c.table_name === 'users' && c.column_name === 'email'
    );
    expect(userEmailUnique).toBeDefined();
  });
});
