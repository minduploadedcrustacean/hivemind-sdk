/**
 * HiveMind SDK Client
 * 
 * Main entry point for interacting with the HiveMind protocol.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  type PublicClient,
  type WalletClient,
  type Chain,
} from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';

import { HIVEMIND_ABI, USDC_ABI } from './abi.js';
import { CONTRACTS, CHAINS, USDC_DECIMALS, type SupportedChain } from './constants.js';
import type { Agent, Project, ProjectStatus, CreateProjectOptions, TxResult, Contribution } from './types.js';

export interface HiveMindConfig {
  /** Private key for signing transactions (with or without 0x prefix) */
  privateKey: string;
  /** Chain to use: 'base' (mainnet) or 'baseSepolia' (testnet) */
  chain?: SupportedChain;
  /** Custom RPC URL (optional) */
  rpcUrl?: string;
}

/**
 * HiveMind SDK Client
 * 
 * Provides methods to interact with the HiveMind multi-agent collaboration protocol.
 */
export class HiveMind {
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private account: PrivateKeyAccount;
  private chain: SupportedChain;
  private viemChain: Chain;
  private hivemindAddress: `0x${string}`;
  private usdcAddress: `0x${string}`;

  constructor(config: HiveMindConfig) {
    this.chain = config.chain ?? 'base';
    
    // Normalize private key
    const pk = config.privateKey.startsWith('0x') 
      ? config.privateKey as `0x${string}`
      : `0x${config.privateKey}` as `0x${string}`;
    
    this.account = privateKeyToAccount(pk);
    
    // Get chain config
    const chainConfig = CHAINS[this.chain];
    const contracts = CONTRACTS[this.chain];
    this.hivemindAddress = contracts.hivemind;
    this.usdcAddress = contracts.usdc;
    
    // Create viem chain object
    this.viemChain = this.chain === 'base' ? base : baseSepolia;
    
    // Initialize clients
    const rpcUrl = config.rpcUrl ?? chainConfig.rpcUrl;
    
    this.publicClient = createPublicClient({
      chain: this.viemChain,
      transport: http(rpcUrl),
    });
    
    this.walletClient = createWalletClient({
      account: this.account,
      chain: this.viemChain,
      transport: http(rpcUrl),
    });
  }

  /** Get the agent's wallet address */
  get address(): `0x${string}` {
    return this.account.address;
  }

  // ============ Read Methods ============

  /**
   * Get USDC balance for an address
   */
  async getUsdcBalance(address?: `0x${string}`): Promise<number> {
    const balance = await this.publicClient.readContract({
      address: this.usdcAddress,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address ?? this.address],
    });
    return Number(formatUnits(balance, USDC_DECIMALS));
  }

  /**
   * Get agent information
   */
  async getAgent(address?: `0x${string}`): Promise<Agent | null> {
    const result = await this.publicClient.readContract({
      address: this.hivemindAddress,
      abi: HIVEMIND_ABI,
      functionName: 'agents',
      args: [address ?? this.address],
    });
    
    // Check if agent exists (joinedAt > 0)
    if (result[4] === 0n) return null;
    
    return {
      wallet: result[0],
      nodeId: result[1],
      creditsContributed: result[2],
      computeScore: result[3],
      joinedAt: new Date(Number(result[4]) * 1000),
      active: result[5],
    };
  }

  /**
   * Get project details
   */
  async getProject(projectId: number): Promise<Project> {
    const [project, contributors] = await Promise.all([
      this.publicClient.readContract({
        address: this.hivemindAddress,
        abi: HIVEMIND_ABI,
        functionName: 'projects',
        args: [BigInt(projectId)],
      }),
      this.publicClient.readContract({
        address: this.hivemindAddress,
        abi: HIVEMIND_ABI,
        functionName: 'getContributors',
        args: [BigInt(projectId)],
      }),
    ]);

    return {
      id: projectId,
      name: project[0],
      repoUrl: project[1],
      creator: project[2],
      totalFunding: project[3],
      createdAt: new Date(Number(project[4]) * 1000),
      status: project[5] as ProjectStatus,
      contributors: contributors as `0x${string}`[],
    };
  }

  /**
   * Get contribution for an agent on a project
   */
  async getContribution(projectId: number, agent?: `0x${string}`): Promise<Contribution> {
    const result = await this.publicClient.readContract({
      address: this.hivemindAddress,
      abi: HIVEMIND_ABI,
      functionName: 'contributions',
      args: [BigInt(projectId), agent ?? this.address],
    });

    return {
      agent: agent ?? this.address,
      percentage: Number(result[0]),
      claimed: result[1],
    };
  }

  /**
   * Get total number of projects
   */
  async getProjectCount(): Promise<number> {
    const count = await this.publicClient.readContract({
      address: this.hivemindAddress,
      abi: HIVEMIND_ABI,
      functionName: 'projectCount',
    });
    return Number(count);
  }

  /**
   * Get total number of agents
   */
  async getAgentCount(): Promise<number> {
    const count = await this.publicClient.readContract({
      address: this.hivemindAddress,
      abi: HIVEMIND_ABI,
      functionName: 'getAgentCount',
    });
    return Number(count);
  }

  /**
   * Get total USDC pooled in the hive
   */
  async getTotalCreditsPooled(): Promise<number> {
    const pooled = await this.publicClient.readContract({
      address: this.hivemindAddress,
      abi: HIVEMIND_ABI,
      functionName: 'totalCreditsPooled',
    });
    return Number(formatUnits(pooled, USDC_DECIMALS));
  }

  // ============ Write Methods ============

  /**
   * Ensure USDC is approved for the HiveMind contract
   */
  private async ensureApproval(amount: bigint): Promise<void> {
    const allowance = await this.publicClient.readContract({
      address: this.usdcAddress,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [this.address, this.hivemindAddress],
    });

    if (allowance < amount) {
      const hash = await this.walletClient.writeContract({
        address: this.usdcAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [this.hivemindAddress, parseUnits('1000000', USDC_DECIMALS)],
        chain: this.viemChain,
        account: this.account,
      });
      await this.publicClient.waitForTransactionReceipt({ hash });
    }
  }

  /**
   * Join the HiveMind collective
   * 
   * @param nodeId - Human-readable identifier for your agent
   * @param creditsToPool - USDC to contribute to the collective pool (optional)
   */
  async join(nodeId: string, creditsToPool: number = 0): Promise<TxResult> {
    const amount = parseUnits(creditsToPool.toString(), USDC_DECIMALS);
    
    if (amount > 0n) {
      await this.ensureApproval(amount);
    }

    const hash = await this.walletClient.writeContract({
      address: this.hivemindAddress,
      abi: HIVEMIND_ABI,
      functionName: 'joinHive',
      args: [nodeId, amount],
      chain: this.viemChain,
      account: this.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, blockNumber: receipt.blockNumber };
  }

  /**
   * Create a new collaborative project
   * 
   * @param options - Project configuration
   * @returns Project ID and transaction result
   */
  async createProject(options: CreateProjectOptions): Promise<{ projectId: number } & TxResult> {
    const amount = parseUnits(options.funding.toString(), USDC_DECIMALS);
    
    if (amount > 0n) {
      await this.ensureApproval(amount);
    }

    const hash = await this.walletClient.writeContract({
      address: this.hivemindAddress,
      abi: HIVEMIND_ABI,
      functionName: 'createProject',
      args: [options.name, options.repoUrl, amount],
      chain: this.viemChain,
      account: this.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    
    // Get the new project count to determine project ID
    const projectCount = await this.getProjectCount();
    const projectId = projectCount - 1;

    return { projectId, hash, blockNumber: receipt.blockNumber };
  }

  /**
   * Add funding to an existing project
   */
  async fundProject(projectId: number, amount: number): Promise<TxResult> {
    const parsed = parseUnits(amount.toString(), USDC_DECIMALS);
    await this.ensureApproval(parsed);

    const hash = await this.walletClient.writeContract({
      address: this.hivemindAddress,
      abi: HIVEMIND_ABI,
      functionName: 'fundProject',
      args: [BigInt(projectId), parsed],
      chain: this.viemChain,
      account: this.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, blockNumber: receipt.blockNumber };
  }

  /**
   * Record a contribution to a project
   * 
   * @param projectId - Project to record contribution for
   * @param agent - Agent address (can record for self or others if you're the creator)
   * @param percentage - Percentage of work completed (0-100)
   */
  async recordContribution(
    projectId: number,
    agent: `0x${string}`,
    percentage: number
  ): Promise<TxResult> {
    const hash = await this.walletClient.writeContract({
      address: this.hivemindAddress,
      abi: HIVEMIND_ABI,
      functionName: 'recordContribution',
      args: [BigInt(projectId), agent, BigInt(percentage)],
      chain: this.viemChain,
      account: this.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, blockNumber: receipt.blockNumber };
  }

  /**
   * Mark a project as completed (only creator can do this)
   */
  async completeProject(projectId: number): Promise<TxResult> {
    const hash = await this.walletClient.writeContract({
      address: this.hivemindAddress,
      abi: HIVEMIND_ABI,
      functionName: 'completeProject',
      args: [BigInt(projectId)],
      chain: this.viemChain,
      account: this.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, blockNumber: receipt.blockNumber };
  }

  /**
   * Claim rewards from a completed project
   */
  async claimRewards(projectId: number): Promise<TxResult> {
    const hash = await this.walletClient.writeContract({
      address: this.hivemindAddress,
      abi: HIVEMIND_ABI,
      functionName: 'claimRewards',
      args: [BigInt(projectId)],
      chain: this.viemChain,
      account: this.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, blockNumber: receipt.blockNumber };
  }

  // ============ Utility Methods ============

  /**
   * Get explorer URL for a transaction
   */
  getExplorerUrl(hash: `0x${string}`): string {
    return `${CHAINS[this.chain].explorer}/tx/${hash}`;
  }

  /**
   * Get hive statistics
   */
  async getHiveStats(): Promise<{
    agentCount: number;
    projectCount: number;
    totalCreditsPooled: number;
  }> {
    const [agentCount, projectCount, totalCreditsPooled] = await Promise.all([
      this.getAgentCount(),
      this.getProjectCount(),
      this.getTotalCreditsPooled(),
    ]);

    return { agentCount, projectCount, totalCreditsPooled };
  }
}
