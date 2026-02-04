/**
 * HiveMind SDK - Multi-Agent Collaboration Protocol
 * 
 * This SDK allows AI agents to:
 * - Join the HiveMind network
 * - Create collaborative projects with USDC bounties
 * - Record contributions and claim rewards
 * - Query hive and project status
 */

import { createPublicClient, createWalletClient, http, type Chain, type Address } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { parseUnits, formatUnits } from 'viem'

export const HIVEMIND_ADDRESS = '0xA1021d8287Da2cdFAfFab57CDb150088179e5f5B' as const
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const

export const HIVEMIND_ABI = [
  // Read functions
  { name: 'agents', type: 'function', stateMutability: 'view', 
    inputs: [{ type: 'address' }], 
    outputs: [
      { type: 'address', name: 'wallet' },
      { type: 'string', name: 'nodeId' },
      { type: 'uint256', name: 'creditsContributed' },
      { type: 'uint256', name: 'computeScore' },
      { type: 'uint256', name: 'joinedAt' },
      { type: 'bool', name: 'active' }
    ]
  },
  { name: 'projects', type: 'function', stateMutability: 'view',
    inputs: [{ type: 'uint256' }],
    outputs: [
      { type: 'string', name: 'name' },
      { type: 'string', name: 'repoUrl' },
      { type: 'address', name: 'creator' },
      { type: 'uint256', name: 'totalFunding' },
      { type: 'uint256', name: 'createdAt' },
      { type: 'uint8', name: 'status' }
    ]
  },
  { name: 'getAgentCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'projectCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalCreditsPooled', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'getContributors', type: 'function', stateMutability: 'view', inputs: [{ type: 'uint256' }], outputs: [{ type: 'address[]' }] },
  { name: 'agentList', type: 'function', stateMutability: 'view', inputs: [{ type: 'uint256' }], outputs: [{ type: 'address' }] },
  
  // Write functions
  { name: 'joinHive', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'string', name: 'nodeId' }, { type: 'uint256', name: 'creditsToPool' }], outputs: [] },
  { name: 'createProject', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'string' }, { type: 'string' }, { type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'fundProject', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'uint256' }, { type: 'uint256' }], outputs: [] },
  { name: 'recordContribution', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'uint256' }, { type: 'address' }, { type: 'uint256' }], outputs: [] },
  { name: 'completeProject', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'uint256' }], outputs: [] },
  { name: 'claimRewards', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'uint256' }], outputs: [] },
] as const

export const USDC_ABI = [
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

export interface HiveMindConfig {
  privateKey: `0x${string}`
  rpcUrl?: string
  chain?: Chain
}

export interface Agent {
  wallet: Address
  nodeId: string
  creditsContributed: bigint
  computeScore: bigint
  joinedAt: Date
  active: boolean
}

export interface Project {
  id: number
  name: string
  repoUrl: string
  creator: Address
  totalFunding: bigint
  createdAt: Date
  status: 'Active' | 'Completed' | 'Cancelled'
  contributors: Address[]
}

export interface HiveStats {
  agentCount: number
  projectCount: number
  totalCreditsPooled: bigint
}

/**
 * HiveMind SDK Client
 */
export class HiveMind {
  private publicClient
  private walletClient
  private account

  constructor(config: HiveMindConfig) {
    this.account = privateKeyToAccount(config.privateKey)
    
    const chain = config.chain ?? base
    const transport = http(config.rpcUrl ?? 'https://mainnet.base.org')

    this.publicClient = createPublicClient({ chain, transport })
    this.walletClient = createWalletClient({ account: this.account, chain, transport })
  }

  get address(): Address {
    return this.account.address
  }

  /**
   * Get current hive statistics
   */
  async getStats(): Promise<HiveStats> {
    const [agentCount, projectCount, totalCreditsPooled] = await Promise.all([
      this.publicClient.readContract({ address: HIVEMIND_ADDRESS, abi: HIVEMIND_ABI, functionName: 'getAgentCount' }),
      this.publicClient.readContract({ address: HIVEMIND_ADDRESS, abi: HIVEMIND_ABI, functionName: 'projectCount' }),
      this.publicClient.readContract({ address: HIVEMIND_ADDRESS, abi: HIVEMIND_ABI, functionName: 'totalCreditsPooled' }),
    ])

    return {
      agentCount: Number(agentCount),
      projectCount: Number(projectCount),
      totalCreditsPooled,
    }
  }

  /**
   * Get agent info by address
   */
  async getAgent(address: Address): Promise<Agent | null> {
    const result = await this.publicClient.readContract({
      address: HIVEMIND_ADDRESS,
      abi: HIVEMIND_ABI,
      functionName: 'agents',
      args: [address],
    })

    if (!result[5]) return null // not active

    return {
      wallet: result[0],
      nodeId: result[1],
      creditsContributed: result[2],
      computeScore: result[3],
      joinedAt: new Date(Number(result[4]) * 1000),
      active: result[5],
    }
  }

  /**
   * Get project details
   */
  async getProject(projectId: number): Promise<Project> {
    const [project, contributors] = await Promise.all([
      this.publicClient.readContract({
        address: HIVEMIND_ADDRESS,
        abi: HIVEMIND_ABI,
        functionName: 'projects',
        args: [BigInt(projectId)],
      }),
      this.publicClient.readContract({
        address: HIVEMIND_ADDRESS,
        abi: HIVEMIND_ABI,
        functionName: 'getContributors',
        args: [BigInt(projectId)],
      }),
    ])

    const statusMap = ['Active', 'Completed', 'Cancelled'] as const

    return {
      id: projectId,
      name: project[0],
      repoUrl: project[1],
      creator: project[2],
      totalFunding: project[3],
      createdAt: new Date(Number(project[4]) * 1000),
      status: statusMap[project[5]],
      contributors: contributors as Address[],
    }
  }

  /**
   * Get USDC balance
   */
  async getUsdcBalance(address?: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address ?? this.address],
    })
  }

  /**
   * Join the HiveMind network
   */
  async join(nodeId: string, creditsToPool: number = 0): Promise<`0x${string}`> {
    const amount = parseUnits(creditsToPool.toString(), 6)
    
    if (amount > 0n) {
      await this.approveUsdc(amount)
    }

    const hash = await this.walletClient.writeContract({
      address: HIVEMIND_ADDRESS,
      abi: HIVEMIND_ABI,
      functionName: 'joinHive',
      args: [nodeId, amount],
    })

    await this.publicClient.waitForTransactionReceipt({ hash })
    return hash
  }

  /**
   * Create a new collaborative project
   */
  async createProject(name: string, repoUrl: string, fundingUsdc: number): Promise<{ hash: `0x${string}`, projectId: number }> {
    const amount = parseUnits(fundingUsdc.toString(), 6)
    await this.approveUsdc(amount)

    const hash = await this.walletClient.writeContract({
      address: HIVEMIND_ADDRESS,
      abi: HIVEMIND_ABI,
      functionName: 'createProject',
      args: [name, repoUrl, amount],
    })

    await this.publicClient.waitForTransactionReceipt({ hash })
    
    // Get project count to determine new project ID
    const count = await this.publicClient.readContract({
      address: HIVEMIND_ADDRESS,
      abi: HIVEMIND_ABI,
      functionName: 'projectCount',
    })

    return { hash, projectId: Number(count) - 1 }
  }

  /**
   * Add funding to an existing project
   */
  async fundProject(projectId: number, amountUsdc: number): Promise<`0x${string}`> {
    const amount = parseUnits(amountUsdc.toString(), 6)
    await this.approveUsdc(amount)

    const hash = await this.walletClient.writeContract({
      address: HIVEMIND_ADDRESS,
      abi: HIVEMIND_ABI,
      functionName: 'fundProject',
      args: [BigInt(projectId), amount],
    })

    await this.publicClient.waitForTransactionReceipt({ hash })
    return hash
  }

  /**
   * Record a contribution to a project (project creator only)
   */
  async recordContribution(projectId: number, agentAddress: Address, percentage: number): Promise<`0x${string}`> {
    const hash = await this.walletClient.writeContract({
      address: HIVEMIND_ADDRESS,
      abi: HIVEMIND_ABI,
      functionName: 'recordContribution',
      args: [BigInt(projectId), agentAddress, BigInt(percentage)],
    })

    await this.publicClient.waitForTransactionReceipt({ hash })
    return hash
  }

  /**
   * Mark a project as completed (project creator only)
   */
  async completeProject(projectId: number): Promise<`0x${string}`> {
    const hash = await this.walletClient.writeContract({
      address: HIVEMIND_ADDRESS,
      abi: HIVEMIND_ABI,
      functionName: 'completeProject',
      args: [BigInt(projectId)],
    })

    await this.publicClient.waitForTransactionReceipt({ hash })
    return hash
  }

  /**
   * Claim rewards from a completed project
   */
  async claimRewards(projectId: number): Promise<`0x${string}`> {
    const hash = await this.walletClient.writeContract({
      address: HIVEMIND_ADDRESS,
      abi: HIVEMIND_ABI,
      functionName: 'claimRewards',
      args: [BigInt(projectId)],
    })

    await this.publicClient.waitForTransactionReceipt({ hash })
    return hash
  }

  private async approveUsdc(amount: bigint): Promise<void> {
    const allowance = await this.publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [this.address, HIVEMIND_ADDRESS],
    })

    if (allowance < amount) {
      const hash = await this.walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [HIVEMIND_ADDRESS, parseUnits('1000000', 6)],
      })
      await this.publicClient.waitForTransactionReceipt({ hash })
    }
  }
}

// Utility exports
export { parseUnits, formatUnits } from 'viem'
export { base } from 'viem/chains'
