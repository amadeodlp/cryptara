import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: string | null;
  balance: string | null;
}

const initialState: WalletState = {
  address: localStorage.getItem('walletAddress'),
  isConnected: localStorage.getItem('walletConnected') === 'true',
  chainId: localStorage.getItem('chainId'),
  balance: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWallet: (state, action: PayloadAction<{ address: string; chainId: string }>) => {
      state.address = action.payload.address;
      state.chainId = action.payload.chainId;
      state.isConnected = true;
      localStorage.setItem('walletAddress', action.payload.address);
      localStorage.setItem('chainId', action.payload.chainId);
      localStorage.setItem('walletConnected', 'true');
    },
    setBalance: (state, action: PayloadAction<string>) => {
      state.balance = action.payload;
    },
    disconnectWallet: (state) => {
      state.address = null;
      state.chainId = null;
      state.isConnected = false;
      state.balance = null;
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('chainId');
      localStorage.removeItem('walletConnected');
    },
  },
});

export const { setWallet, setBalance, disconnectWallet } = walletSlice.actions;
export default walletSlice.reducer;