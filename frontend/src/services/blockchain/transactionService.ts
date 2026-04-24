import { supabase } from '@/lib/supabase';
import { getProvider as _getProvider } from '../web3Service';

export interface Transaction {
  id: string;
  type: string;
  asset?: string;
  assetFrom?: string;
  assetTo?: string;
  amount?: string;
  amountFrom?: string;
  amountTo?: string;
  from?: string;
  to?: string;
  date: string;
  status: string;
  fee?: string;
  txHash?: string;
}

function mapRow(row: any): Transaction {
  return {
    id: String(row.id),
    type: row.type.charAt(0) + row.type.slice(1).toLowerCase(), // SENT → Sent
    asset: row.asset,
    amount: row.amount ? String(row.amount) : undefined,
    from: row.from_address || undefined,
    to: row.to_address || undefined,
    date: row.created_at,
    status: row.status || 'Completed',
    fee: row.fee || undefined,
    txHash: row.tx_hash || undefined,
  };
}

// Fetch transactions from Supabase for the authenticated user
export const fetchTransactions = async (_walletAddress: string): Promise<Transaction[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }

  return (data || []).map(mapRow);
};

// Get basic transactions from wallet history (blockchain fallback — ethers v6 removed getHistory)
export const getWalletHistory = async (_walletAddress: string): Promise<Transaction[]> => {
  throw new Error('Direct blockchain history not available in ethers v6');
};

export const getPlaceholderTransactions = (showPlaceholderFlag = true): Transaction[] => {
  console.warn('Using placeholder transaction data!');
  const now = new Date();
  return [
    {
      id: 't1',
      type: 'Received',
      asset: 'ETH',
      amount: '0.5',
      from: showPlaceholderFlag ? '0x7Be...1a2b (PLACEHOLDER)' : '0x7Be8e9611De3d0D85D5a29C6131c3131Cde1a2b',
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: showPlaceholderFlag ? 'PLACEHOLDER' : 'Completed',
      fee: '0.002 ETH',
      txHash: '0x3a1bda28a5cf9cb3268e52d781de0Nb38162Ge3f',
    },
    {
      id: 't2',
      type: 'Sent',
      asset: 'FIN',
      amount: '150',
      to: showPlaceholderFlag ? '0xAb3...9e (PLACEHOLDER)' : '0xAb3d5e87f1c2bf2c8D8f60e8aAc437f9e',
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: showPlaceholderFlag ? 'PLACEHOLDER' : 'Completed',
      fee: '0.001 ETH',
      txHash: '0x5c2e9a8b1f4d7e6a3b2c1d0e9f8e7d6c5b4a3f2e',
    },
  ];
};
