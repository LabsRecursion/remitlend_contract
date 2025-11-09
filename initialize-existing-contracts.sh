#!/bin/bash

# Initialize existing deployed contracts
# This uses the new public initialize() functions

set -e

echo "🔧 Initializing RemitLend contracts..."
echo ""

# Load contract IDs from .env
source .env

# Your wallet address (you'll need to sign these transactions)
echo "⚠️  You will need to sign transactions to initialize the contracts."
echo ""

# Initialize RemittanceNFT
echo "1️⃣  Initializing RemittanceNFT..."
stellar contract invoke \
  --id $PUBLIC_REMITTANCE_NFT_CONTRACT_ID \
  --source-account deployer \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address deployer) \
  --oracle $PUBLIC_REMITTANCE_NFT_CONTRACT_ID \
  --loan_manager $PUBLIC_LOAN_MANAGER_CONTRACT_ID

echo "   ✅ RemittanceNFT initialized!"
echo ""

# Initialize LoanManager
echo "2️⃣  Initializing LoanManager..."
stellar contract invoke \
  --id $PUBLIC_LOAN_MANAGER_CONTRACT_ID \
  --source-account deployer \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address deployer) \
  --nft_contract $PUBLIC_REMITTANCE_NFT_CONTRACT_ID \
  --pool_contract $PUBLIC_LENDING_POOL_CONTRACT_ID \
  --oracle_contract $PUBLIC_REMITTANCE_NFT_CONTRACT_ID \
  --usdc_token CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA

echo "   ✅ LoanManager initialized!"
echo ""

echo "🎉 All contracts initialized successfully!"
echo ""
echo "You can now use the dApp to:"
echo "  - Mint remittance NFTs"
echo "  - Request loans with NFT collateral"
echo "  - Make loan payments"
