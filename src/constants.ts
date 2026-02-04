/**
 * HiveMind Contract Addresses and Chain Configuration
 */

export type SupportedChain = 'base' | 'baseSepolia';

/** Contract addresses per chain */
export const CONTRACTS = {
  base: {
    hivemind: '0xA1021d8287Da2cdFAfFab57CDb150088179e5f5B' as const,
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
  },
  baseSepolia: {
    hivemind: '0x0000000000000000000000000000000000000000' as const, // TODO: Deploy to testnet
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const,
  },
} as const;

/** Chain configuration */
export const CHAINS = {
  base: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
  },
  baseSepolia: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
  },
} as const;

/** USDC has 6 decimals */
export const USDC_DECIMALS = 6;
