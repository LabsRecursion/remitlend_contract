/**
 * Custom React hook for interacting with contracts
 * Use this in your components for easy contract interactions
 */

import { useState } from 'react';
import { useWallet } from './useWallet';
import * as contractInteractions from '../contracts/contractInteractions';

export function useContractInteractions() {
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signTransaction = async (xdr: string): Promise<string> => {
    if (!wallet?.connected || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    // Sign using the connected wallet
    const result = await wallet.signTransaction(xdr, {
      networkPassphrase: wallet.networkPassphrase || '',
    });

    return result.signedTxXdr;
  };

  const mintNFT = async ({
    monthlyAmount,
    reliabilityScore,
    historyMonths,
    totalSent,
  }: {
    monthlyAmount: bigint;
    reliabilityScore: number;
    historyMonths: number;
    totalSent: bigint;
  }) => {
    if (!wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await contractInteractions.mintRemittanceNFT({
        publicKey: wallet.publicKey,
        signTransaction,
        monthlyAmount,
        reliabilityScore,
        historyMonths,
        totalSent,
      });
      
      setIsLoading(false);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      throw error;
    }
  };

  const depositToPool = async (amount: bigint) => {
    if (!wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await contractInteractions.depositToLendingPool({
        publicKey: wallet.publicKey,
        signTransaction,
        amount,
      });
      
      setIsLoading(false);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      throw error;
    }
  };

  const requestLoan = async ({
    nftCollateralId,
    loanAmount,
    durationMonths,
  }: {
    nftCollateralId: bigint;
    loanAmount: bigint;
    durationMonths: number;
  }) => {
    if (!wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await contractInteractions.requestLoan({
        publicKey: wallet.publicKey,
        signTransaction,
        nftCollateralId,
        loanAmount,
        durationMonths,
      });
      
      setIsLoading(false);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      throw error;
    }
  };

  const getNFTData = async (tokenId: bigint) => {
    if (!wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await contractInteractions.getNFTData({
        tokenId,
        publicKey: wallet.publicKey,
      });
      
      setIsLoading(false);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      throw error;
    }
  };

  const getLoanDetails = async (loanId: bigint) => {
    if (!wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await contractInteractions.getLoanDetails({
        loanId,
        publicKey: wallet.publicKey,
      });
      
      setIsLoading(false);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      throw error;
    }
  };

  const getLenderInfo = async (lenderAddress?: string) => {
    // For read-only operations, we only need a public key for the query
    const queryPublicKey = wallet?.publicKey || wallet?.address;
    if (!queryPublicKey) {
      throw new Error('Wallet not connected');
    }

    const address = lenderAddress || queryPublicKey;

    try {
      const result = await contractInteractions.getLenderInfo({
        lenderAddress: address,
        publicKey: queryPublicKey,
      });
      
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  const getAvailableLiquidity = async () => {
    // For read-only operations, we only need a public key for the query
    const queryPublicKey = wallet?.publicKey || wallet?.address;
    if (!queryPublicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await contractInteractions.getAvailableLiquidity({
        publicKey: queryPublicKey,
      });
      
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  const getUtilizationRate = async () => {
    // For read-only operations, we only need a public key for the query
    const queryPublicKey = wallet?.publicKey || wallet?.address;
    if (!queryPublicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await contractInteractions.getUtilizationRate({
        publicKey: queryPublicKey,
      });
      
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  return {
    isLoading,
    error,
    mintNFT,
    depositToPool,
    requestLoan,
    getNFTData,
    getLoanDetails,
    getLenderInfo,
    getAvailableLiquidity,
    getUtilizationRate,
  };
}
