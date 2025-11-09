import React, { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { buildContractTransaction, submitTransaction, toScVal } from "../contracts/contractHelpers";

const CONTRACTS = {
  REMITTANCE_NFT: "CA26R6MGUXH77VNOWDEWFYC3FETLN2YL7G3DNUHNTZILMLPXW5VIFJSJ",
  LOAN_MANAGER: "CAPEVDLBQGBHLFTWJOXDEFXKU26ANRVNJO4526KSLKRVVG36RBCXVWKH",
  LENDING_POOL: "CAT5Y7Q26YJS2UD3RUWT5XBMJSYZHATKKZOR2EBZVWA6YF2VM4XCZICV",
};

const USDC_TOKEN = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

export const AdminPage: React.FC = () => {
  const { connected, publicKey, signTransaction } = useWallet();
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const initializeRemittanceNFT = async () => {
    if (!connected || !publicKey || !signTransaction) {
      alert("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setStatus("Initializing RemittanceNFT...");

    try {
      const { transaction } = await buildContractTransaction({
        contractId: CONTRACTS.REMITTANCE_NFT,
        method: "initialize",
        args: [
          toScVal.address(publicKey), // admin
          toScVal.address(CONTRACTS.REMITTANCE_NFT), // oracle (self)
          toScVal.address(CONTRACTS.LOAN_MANAGER), // loan_manager
        ],
        publicKey,
      });

      const signedResult = await signTransaction(transaction.toXDR());
      const result = await submitTransaction(signedResult.signedTxXdr);

      setStatus("✅ RemittanceNFT initialized successfully!");
      console.log("Result:", result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setStatus(`❌ Error: ${errorMessage}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initializeLoanManager = async () => {
    if (!connected || !publicKey || !signTransaction) {
      alert("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setStatus("Initializing LoanManager...");

    try {
      const { transaction } = await buildContractTransaction({
        contractId: CONTRACTS.LOAN_MANAGER,
        method: "initialize",
        args: [
          toScVal.address(publicKey), // admin
          toScVal.address(CONTRACTS.REMITTANCE_NFT), // nft_contract
          toScVal.address(CONTRACTS.LENDING_POOL), // pool_contract
          toScVal.address(CONTRACTS.REMITTANCE_NFT), // oracle_contract
          toScVal.address(USDC_TOKEN), // usdc_token
        ],
        publicKey,
      });

      const signedResult = await signTransaction(transaction.toXDR());
      const result = await submitTransaction(signedResult.signedTxXdr);

      setStatus("✅ LoanManager initialized successfully!");
      console.log("Result:", result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setStatus(`❌ Error: ${errorMessage}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin - Contract Initialization</h1>

      {!connected && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Please connect your wallet to initialize contracts
        </div>
      )}

      <div className="space-y-4">
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">1. Initialize RemittanceNFT</h2>
          <button
            type="button"
            onClick={() => void initializeRemittanceNFT()}
            disabled={!connected || loading}
            className="btn btn-primary"
          >
            Initialize RemittanceNFT
          </button>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">2. Initialize LoanManager</h2>
          <button
            type="button"
            onClick={() => void initializeLoanManager()}
            disabled={!connected || loading}
            className="btn btn-primary"
          >
            Initialize LoanManager
          </button>
        </div>

        {status && (
          <div className="card p-6 bg-gray-100">
            <h3 className="font-semibold mb-2">Status:</h3>
            <p>{status}</p>
          </div>
        )}
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Contract Addresses:</h3>
        <ul className="space-y-1">
          <li>RemittanceNFT: {CONTRACTS.REMITTANCE_NFT}</li>
          <li>LoanManager: {CONTRACTS.LOAN_MANAGER}</li>
          <li>LendingPool: {CONTRACTS.LENDING_POOL}</li>
        </ul>
      </div>
    </div>
  );
};
