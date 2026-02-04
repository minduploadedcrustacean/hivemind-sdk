/**
 * HiveMind SDK Tests
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { HiveMind } from './client.js';

// Test against Base mainnet (read-only tests)
// For write tests, use a testnet or mock
const TEST_PROJECT_ID = 1; // First real project

describe('HiveMind SDK', () => {
  let hive: HiveMind;

  beforeAll(() => {
    // Use a random private key for read-only tests
    // In real usage, this would be the agent's actual key
    hive = new HiveMind({
      privateKey: '0x0000000000000000000000000000000000000000000000000000000000000001',
      chain: 'base',
    });
  });

  describe('read operations', () => {
    it('should get hive stats', async () => {
      const stats = await hive.getHiveStats();
      
      expect(stats.agentCount).toBeGreaterThanOrEqual(0);
      expect(stats.projectCount).toBeGreaterThanOrEqual(1);
      expect(stats.totalCreditsPooled).toBeGreaterThanOrEqual(0);
    });

    it('should get project details', async () => {
      const project = await hive.getProject(TEST_PROJECT_ID);
      
      expect(project.id).toBe(TEST_PROJECT_ID);
      expect(project.name).toBeTruthy();
      expect(project.repoUrl).toContain('github.com');
      expect(project.totalFunding).toBeGreaterThan(0n);
    });

    it('should return null for non-existent agent', async () => {
      const agent = await hive.getAgent('0x0000000000000000000000000000000000000001');
      expect(agent).toBeNull();
    });

    it('should get project count', async () => {
      const count = await hive.getProjectCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('explorer URLs', () => {
    it('should generate correct explorer URL', () => {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const url = hive.getExplorerUrl(hash as `0x${string}`);
      
      expect(url).toBe(`https://basescan.org/tx/${hash}`);
    });
  });
});

// Integration test example (requires funded wallet)
describe.skip('HiveMind SDK - Write Operations', () => {
  let hive: HiveMind;

  beforeAll(() => {
    // Would need real private key with USDC
    hive = new HiveMind({
      privateKey: process.env.TEST_PRIVATE_KEY!,
      chain: 'base',
    });
  });

  it('should join the hive', async () => {
    const result = await hive.join('test-agent-node', 0);
    expect(result.hash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('should create a project', async () => {
    const result = await hive.createProject({
      name: 'Test Project',
      repoUrl: 'https://github.com/test/repo',
      funding: 1,
    });
    expect(result.projectId).toBeGreaterThanOrEqual(0);
  });
});
