/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_STELLAR_NETWORK: string;
  readonly PUBLIC_STELLAR_NETWORK_PASSPHRASE: string;
  readonly PUBLIC_STELLAR_RPC_URL: string;
  readonly PUBLIC_STELLAR_HORIZON_URL: string;
  readonly PUBLIC_REMITTANCE_NFT_CONTRACT_ID: string;
  readonly PUBLIC_LENDING_POOL_CONTRACT_ID: string;
  readonly PUBLIC_LOAN_MANAGER_CONTRACT_ID: string;
  readonly PUBLIC_RMTLEND_CONTRACT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
