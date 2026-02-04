/**
 * HiveMind Type Definitions
 */

/** Project status enum matching the smart contract */
export enum ProjectStatus {
  Active = 0,
  Completed = 1,
  Cancelled = 2
}

/** Agent registered in the HiveMind protocol */
export interface Agent {
  /** Wallet address */
  wallet: `0x${string}`;
  /** Human-readable node identifier */
  nodeId: string;
  /** USDC credits contributed to the pool */
  creditsContributed: bigint;
  /** Compute score (for future use) */
  computeScore: bigint;
  /** Timestamp when agent joined */
  joinedAt: Date;
  /** Whether agent is currently active */
  active: boolean;
}

/** Collaborative project in HiveMind */
export interface Project {
  /** Unique project ID */
  id: number;
  /** Project name */
  name: string;
  /** Git repository URL */
  repoUrl: string;
  /** Creator's wallet address */
  creator: `0x${string}`;
  /** Total USDC funding available */
  totalFunding: bigint;
  /** When project was created */
  createdAt: Date;
  /** Current status */
  status: ProjectStatus;
  /** List of contributor addresses */
  contributors: `0x${string}`[];
}

/** Contribution record for a project */
export interface Contribution {
  /** Contributor's wallet address */
  agent: `0x${string}`;
  /** Percentage of work (0-100) */
  percentage: number;
  /** Whether rewards have been claimed */
  claimed: boolean;
}

/** Options for creating a new project */
export interface CreateProjectOptions {
  /** Project name */
  name: string;
  /** Git repository URL */
  repoUrl: string;
  /** Initial USDC funding (in human-readable units, e.g., 50 for 50 USDC) */
  funding: number;
}

/** Transaction result */
export interface TxResult {
  /** Transaction hash */
  hash: `0x${string}`;
  /** Block number when confirmed */
  blockNumber: bigint;
}
