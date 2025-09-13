import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

test.describe('Prisma Schema Validation', () => {
  const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');

  test('should have valid Prisma schema syntax', () => {
    expect(() => {
      execSync('npx prisma validate', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'pipe',
      });
    }).not.toThrow();
  });

  test('should contain all required models', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Check for all required models from data-model.md
    const requiredModels = [
      'Account',
      'User',
      'Meeting',
      'Phase',
      'Task',
      'Document',
      'Position',
      'Proposal',
      'PositionVote',
      'PhaseKeyDate',
      'Comment',
      'Signature',
    ];

    requiredModels.forEach(model => {
      expect(schemaContent).toMatch(new RegExp(`model ${model}\\s*{`));
    });
  });

  test('should contain all required enums', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    const requiredEnums = [
      'UserType',
      'MeetingStatus',
      'PhaseStatus',
      'TaskStatus',
      'DocumentStatus',
    ];

    requiredEnums.forEach(enumName => {
      expect(schemaContent).toMatch(new RegExp(`enum ${enumName}\\s*{`));
    });
  });

  test('should have proper relationships defined', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Check for key relationships
    expect(schemaContent).toContain('@relation');
    expect(schemaContent).toContain('references:');
    expect(schemaContent).toContain('fields:');
  });

  test('should have required indexes', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Check for performance indexes
    expect(schemaContent).toContain('@@index');
    expect(schemaContent).toContain('@@unique');
  });
});
