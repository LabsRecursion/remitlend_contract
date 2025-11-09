#!/bin/bash

# Initialize contracts with proper addresses
# Run this after deploying all contracts

# Get contract IDs from .env
source .env

echo "Initializing RemittanceNFT contract..."
stellar contract invoke \
  --id $PUBLIC_REMITTANCE_NFT_CONTRACT_ID \
  --source alice \
  --network testnet \
  -- __initialize \
  --oracle "$PUBLIC_REMITTANCE_NFT_CONTRACT_ID" \
  --loan_manager "$PUBLIC_LOAN_MANAGER_CONTRACT_ID"

echo "Initializing LendingPool contract..."
stellar contract invoke \
  --id $PUBLIC_LENDING_POOL_CONTRACT_ID \
  --source alice \
  --network testnet \
  -- __initialize \
  --loan_manager "$PUBLIC_LOAN_MANAGER_CONTRACT_ID" \
  --usdc_token "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

echo "Initializing LoanManager contract..."
stellar contract invoke \
  --id $PUBLIC_LOAN_MANAGER_CONTRACT_ID \
  --source alice \
  --network testnet \
  -- __initialize \
  --nft_contract "$PUBLIC_REMITTANCE_NFT_CONTRACT_ID" \
  --pool_contract "$PUBLIC_LENDING_POOL_CONTRACT_ID" \
  --oracle_contract "$PUBLIC_REMITTANCE_NFT_CONTRACT_ID" \
  --usdc_token "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

echo "All contracts initialized!"
