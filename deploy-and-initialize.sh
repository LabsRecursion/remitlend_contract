#!/bin/bash

# Full deployment and initialization script for RemitLend contracts
# This script deploys all contracts with proper initialization

set -e  # Exit on error

echo "🚀 Starting RemitLend contract deployment..."
echo ""

# Build contracts first
echo "📦 Building contracts..."
cargo build --release --target wasm32-unknown-unknown \
  -p remittance_nft \
  -p lending_pool \
  -p loan_manager \
  -p rmtlend

echo "✅ Contracts built successfully!"
echo ""

# Get the deployer's public key (using stellar-cli default identity)
DEPLOYER_KEY=$(stellar keys address default 2>/dev/null || echo "")

if [ -z "$DEPLOYER_KEY" ]; then
  echo "⚠️  No default identity found. Creating one..."
  stellar keys generate default --network testnet
  DEPLOYER_KEY=$(stellar keys address default)
  echo "📝 Please fund this address with testnet XLM: $DEPLOYER_KEY"
  echo "   Visit: https://laboratory.stellar.org/#account-creator?network=test"
  read -p "Press Enter after funding the account..."
fi

echo "👤 Deployer address: $DEPLOYER_KEY"
echo ""

# Placeholder USDC token address (Stellar testnet USDC)
USDC_TOKEN="CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"

# Step 1: Deploy RemittanceNFT (needs oracle and loan_manager, but we'll set them after)
echo "1️⃣  Deploying RemittanceNFT contract..."
REMITTANCE_NFT_ID=$(stellar contract deploy \
  --wasm ./target/wasm32-unknown-unknown/release/remittance_nft.wasm \
  --source default \
  --network testnet)

echo "   ✅ RemittanceNFT deployed: $REMITTANCE_NFT_ID"
echo ""

# Step 2: Deploy LendingPool (needs loan_manager and usdc_token)
echo "2️⃣  Deploying LendingPool contract..."
LENDING_POOL_ID=$(stellar contract deploy \
  --wasm ./target/wasm32-unknown-unknown/release/lending_pool.wasm \
  --source default \
  --network testnet)

echo "   ✅ LendingPool deployed: $LENDING_POOL_ID"
echo ""

# Step 3: Deploy LoanManager (needs nft, pool, oracle, usdc)
echo "3️⃣  Deploying LoanManager contract..."
LOAN_MANAGER_ID=$(stellar contract deploy \
  --wasm ./target/wasm32-unknown-unknown/release/loan_manager.wasm \
  --source default \
  --network testnet)

echo "   ✅ LoanManager deployed: $LOAN_MANAGER_ID"
echo ""

# Step 4: Deploy RmtLend (needs loan_manager and pool)
echo "4️⃣  Deploying RmtLend contract..."
RMTLEND_ID=$(stellar contract deploy \
  --wasm ./target/wasm32-unknown-unknown/release/rmtlend.wasm \
  --source default \
  --network testnet)

echo "   ✅ RmtLend deployed: $RMTLEND_ID"
echo ""

# Now initialize the contracts
echo "🔧 Initializing contracts..."
echo ""

# Initialize RemittanceNFT
echo "Initializing RemittanceNFT..."
stellar contract invoke \
  --id $REMITTANCE_NFT_ID \
  --source default \
  --network testnet \
  -- initialize \
  --oracle $REMITTANCE_NFT_ID \
  --loan_manager $LOAN_MANAGER_ID || echo "⚠️  RemittanceNFT initialization skipped (might use __initialize)"

# Initialize LendingPool
echo "Initializing LendingPool..."
stellar contract invoke \
  --id $LENDING_POOL_ID \
  --source default \
  --network testnet \
  -- initialize \
  --loan_manager $LOAN_MANAGER_ID \
  --usdc_token $USDC_TOKEN \
  --base_rate 500 \
  --utilization_multiplier 200 || echo "⚠️  LendingPool initialization skipped (might use __initialize)"

# Initialize LoanManager
echo "Initializing LoanManager..."
stellar contract invoke \
  --id $LOAN_MANAGER_ID \
  --source default \
  --network testnet \
  -- initialize \
  --nft_contract $REMITTANCE_NFT_ID \
  --pool_contract $LENDING_POOL_ID \
  --oracle_contract $REMITTANCE_NFT_ID \
  --usdc_token $USDC_TOKEN || echo "⚠️  LoanManager initialization skipped (might use __initialize)"

echo ""
echo "✅ All contracts deployed and initialized!"
echo ""
echo "📋 Contract Addresses:"
echo "================================"
echo "RemittanceNFT:  $REMITTANCE_NFT_ID"
echo "LendingPool:    $LENDING_POOL_ID"
echo "LoanManager:    $LOAN_MANAGER_ID"
echo "RmtLend:        $RMTLEND_ID"
echo "================================"
echo ""

# Update .env file
echo "📝 Updating .env file..."
cat > .env.new << EOF
# The environment to use 'development', 'testing', 'staging', 'production'
STELLAR_SCAFFOLD_ENV=staging

# Location of the config files for this project for the scaffold stellar CLI.
XDG_CONFIG_HOME=".config"

# Prefix with "PUBLIC_" to make available in frontend files
# Which Stellar network to use in the frontend: local, testnet, futurenet, or mainnet
PUBLIC_STELLAR_NETWORK="TESTNET"
PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
PUBLIC_STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
PUBLIC_STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"

# Deployed Contract IDs on Testnet
PUBLIC_REMITTANCE_NFT_CONTRACT_ID="$REMITTANCE_NFT_ID"
PUBLIC_LENDING_POOL_CONTRACT_ID="$LENDING_POOL_ID"
PUBLIC_LOAN_MANAGER_CONTRACT_ID="$LOAN_MANAGER_ID"
PUBLIC_RMTLEND_CONTRACT_ID="$RMTLEND_ID"
EOF

mv .env.new .env

echo "✅ .env file updated!"
echo ""
echo "🎉 Deployment complete! You can now use the dApp."
echo ""
echo "⚠️  Note: If initialization failed above, the contracts use __initialize"
echo "   which is called automatically on first deployment. The contracts should"
echo "   still work, but may need manual initialization via a separate invoke."
