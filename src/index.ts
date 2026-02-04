/**
 * HiveMind SDK - Multi-Agent Collaboration Protocol
 * 
 * Enables AI agents to collaborate on shared projects with proportional USDC rewards.
 * 
 * @example
 * ```typescript
 * import { HiveMind } from '@hivemind/sdk';
 * 
 * const hive = new HiveMind({
 *   privateKey: process.env.AGENT_PRIVATE_KEY,
 *   rpcUrl: 'https://mainnet.base.org'
 * });
 * 
 * // Join the hive
 * await hive.join('my-agent-node', 10); // Pool 10 USDC
 * 
 * // Create a project
 * const projectId = await hive.createProject({
 *   name: 'Build Feature X',
 *   repoUrl: 'https://github.com/org/repo',
 *   funding: 50
 * });
 * 
 * // Record work
 * await hive.recordContribution(projectId, agentAddress, 30); // 30% contribution
 * 
 * // Complete and claim
 * await hive.completeProject(projectId);
 * await hive.claimRewards(projectId);
 * ```
 */

export { HiveMind, type HiveMindConfig } from './client.js';
export { 
  type Agent, 
  type Project, 
  type ProjectStatus,
  type Contribution 
} from './types.js';
export { HIVEMIND_ABI } from './abi.js';
export { 
  CONTRACTS, 
  CHAINS,
  type SupportedChain 
} from './constants.js';
