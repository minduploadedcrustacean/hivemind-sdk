/**
 * HiveMind V2 Contract ABI
 */

export const HIVEMIND_ABI = [
  // Read functions
  {
    name: 'agents',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [
      { name: 'wallet', type: 'address' },
      { name: 'nodeId', type: 'string' },
      { name: 'creditsContributed', type: 'uint256' },
      { name: 'computeScore', type: 'uint256' },
      { name: 'joinedAt', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    name: 'projects',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'projectId', type: 'uint256' }],
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'repoUrl', type: 'string' },
      { name: 'creator', type: 'address' },
      { name: 'totalFunding', type: 'uint256' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'status', type: 'uint8' },
    ],
  },
  {
    name: 'getAgentCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getContributors',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'projectId', type: 'uint256' }],
    outputs: [{ type: 'address[]' }],
  },
  {
    name: 'projectCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalCreditsPooled',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'contributions',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'projectId', type: 'uint256' },
      { name: 'agent', type: 'address' },
    ],
    outputs: [
      { name: 'percentage', type: 'uint256' },
      { name: 'claimed', type: 'bool' },
    ],
  },
  
  // Write functions
  {
    name: 'joinHive',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nodeId', type: 'string' },
      { name: 'creditsToPool', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'createProject',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'repoUrl', type: 'string' },
      { name: 'initialFunding', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'fundProject',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'recordContribution',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'uint256' },
      { name: 'agent', type: 'address' },
      { name: 'percentage', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'completeProject',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'projectId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claimRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'projectId', type: 'uint256' }],
    outputs: [],
  },
] as const;

export const USDC_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const;
