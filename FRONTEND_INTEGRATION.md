# Frontend Contract Integration Guide

## 📋 Overview

Your contracts are now deployed on Stellar Testnet! Here's how to interact with them from your frontend.

## 🔗 Deployed Contracts

| Contract | Contract ID |
|----------|-------------|
| **Remittance NFT** | `CBAE3DN35VOUNHTKFDF5OFTKMPT3JYXI3NUED4NYIRDFQ2BNLUGL5BNK` |
| **Lending Pool** | `CAT5Y7Q26YJS2UD3RUWT5XBMJSYZHATKKZOR2EBZVWA6YF2VM4XCZICV` |
| **Loan Manager** | `CACUHFQCX5I2MFT5PLFYB46LHH6QBP3Q7NAQRHIK2HJWB4JAOQWJMAWT` |
| **RmtLend** | `CDYVIHH5MC4OGBB4KMWCGAAUNZYFRI7SSZOPTVHJKTNL3SI6GEFJ64MD` |

## 🚀 Quick Start

### 1. Environment Setup

Your `.env` file is already configured with the contract IDs. Make sure your app is running with testnet configuration:

```bash
npm run dev
```

### 2. Using Contracts in Components

#### Example 1: Deposit to Lending Pool

```tsx
import { useContractInteractions } from '../hooks/useContractInteractions';
import { Button } from '@stellar/design-system';

function LendingComponent() {
  const { depositToPool, isLoading, error } = useContractInteractions();

  const handleDeposit = async () => {
    try {
      // Amount in stroops (1 XLM = 10,000,000 stroops)
      const amount = BigInt(100_0000000); // 100 XLM
      
      const result = await depositToPool(amount);
      console.log('Deposit successful:', result);
      alert('Deposit successful!');
    } catch (err) {
      console.error('Deposit failed:', err);
      alert('Deposit failed: ' + (err as Error).message);
    }
  };

  return (
    <div>
      <Button onClick={handleDeposit} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Deposit 100 XLM'}
      </Button>
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
    </div>
  );
}
```

#### Example 2: Request a Loan

```tsx
import { useContractInteractions } from '../hooks/useContractInteractions';
import { useState } from 'react';

function BorrowComponent() {
  const { requestLoan, isLoading } = useContractInteractions();
  const [nftId, setNftId] = useState('');
  const [amount, setAmount] = useState('');

  const handleRequestLoan = async () => {
    try {
      const result = await requestLoan({
        nftCollateralId: BigInt(nftId),
        loanAmount: BigInt(parseFloat(amount) * 10000000), // Convert XLM to stroops
        interestRate: 500, // 5% APR (in basis points)
        durationMonths: 12,
      });
      
      console.log('Loan requested:', result);
      alert('Loan request submitted!');
    } catch (err) {
      console.error('Loan request failed:', err);
    }
  };

  return (
    <div>
      <input 
        type="number" 
        placeholder="NFT ID" 
        value={nftId}
        onChange={(e) => setNftId(e.target.value)}
      />
      <input 
        type="number" 
        placeholder="Loan Amount (XLM)" 
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleRequestLoan} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Request Loan'}
      </button>
    </div>
  );
}
```

#### Example 3: Mint Remittance NFT

```tsx
import { useContractInteractions } from '../hooks/useContractInteractions';

function VerificationComponent() {
  const { mintNFT, isLoading } = useContractInteractions();

  const handleMint = async () => {
    try {
      const result = await mintNFT({
        monthlyAmount: BigInt(500_0000000), // $500 equivalent in stroops
        reliabilityScore: 95, // 95% reliability
        historyMonths: 24, // 2 years of history
        totalSent: BigInt(12000_0000000), // $12,000 total sent
      });
      
      console.log('NFT minted:', result);
      alert('NFT minted successfully!');
    } catch (err) {
      console.error('Minting failed:', err);
    }
  };

  return (
    <button onClick={handleMint} disabled={isLoading}>
      {isLoading ? 'Minting...' : 'Mint Remittance NFT'}
    </button>
  );
}
```

#### Example 4: Read Contract Data

```tsx
import { useContractInteractions } from '../hooks/useContractInteractions';
import { useEffect, useState } from 'react';

function LoanDetailsComponent({ loanId }: { loanId: bigint }) {
  const { getLoanDetails } = useContractInteractions();
  const [loanData, setLoanData] = useState(null);

  useEffect(() => {
    async function fetchLoanData() {
      try {
        const result = await getLoanDetails(loanId);
        setLoanData(result);
      } catch (err) {
        console.error('Failed to fetch loan data:', err);
      }
    }

    fetchLoanData();
  }, [loanId]);

  return (
    <div>
      {loanData ? (
        <pre>{JSON.stringify(loanData, null, 2)}</pre>
      ) : (
        <p>Loading loan details...</p>
      )}
    </div>
  );
}
```

## 📦 Available Functions

The `useContractInteractions` hook provides the following functions:

- **`mintNFT(params)`** - Mint a new Remittance NFT
- **`depositToPool(amount)`** - Deposit tokens into the lending pool
- **`requestLoan(params)`** - Request a loan with NFT collateral
- **`getNFTData(tokenId)`** - Get NFT data (read-only)
- **`getLoanDetails(loanId)`** - Get loan details (read-only)

All functions return a Promise and automatically handle wallet signing.

## 🔧 Direct Contract Interaction

If you need more control, you can use the lower-level functions:

```typescript
import { buildContractTransaction, submitTransaction, toScVal, CONTRACTS } from '../contracts/contractHelpers';

// Example: Custom contract call
async function customContractCall(wallet: any) {
  const { transaction } = await buildContractTransaction({
    contractId: CONTRACTS.REMITTANCE_NFT,
    method: 'your_method_name',
    args: [
      toScVal.string('example'),
      toScVal.u64(BigInt(123)),
      toScVal.address(wallet.publicKey),
    ],
    publicKey: wallet.publicKey,
  });

  const signedXDR = await wallet.signTransaction(transaction.toXDR());
  const result = await submitTransaction(signedXDR);
  
  return result;
}
```

## 💡 Tips

1. **Amount Conversion**: Stellar uses stroops (1 XLM = 10,000,000 stroops)
   ```typescript
   const xlmAmount = 100; // 100 XLM
   const stroops = BigInt(xlmAmount * 10_000_000);
   ```

2. **Interest Rates**: Use basis points (1% = 100 basis points)
   ```typescript
   const interestRate = 500; // 5% APR
   ```

3. **Error Handling**: Always wrap contract calls in try-catch blocks

4. **Wallet Connection**: Make sure the user's wallet is connected before calling contract functions

## 🔍 Testing

Test your contracts on [Stellar Laboratory](https://lab.stellar.org/) or [Stellar Expert](https://stellar.expert/explorer/testnet).

## 📚 Additional Resources

- [Soroban Documentation](https://soroban.stellar.org/docs)
- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)
- [Contract IDs on Stellar Expert](https://stellar.expert/explorer/testnet)
