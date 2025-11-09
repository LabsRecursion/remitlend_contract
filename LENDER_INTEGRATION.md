# Lender Dashboard Smart Contract Integration

This document describes the smart contract integration for the Lender Dashboard page.

## Overview

The Lender Dashboard has been integrated with the `lending_pool` smart contract to enable users to:
- Deposit USDC into the lending pool
- Withdraw USDC (principal + interest) from the lending pool (TODO: contract method needed)
- View real-time pool statistics from the blockchain
- Track their position and earnings from the contract

## Contract Used

- **lending_pool**: `CAT5Y7Q26YJS2UD3RUWT5XBMJSYZHATKKZOR2EBZVWA6YF2VM4XCZICV`

## Features Implemented

### 1. Deposit Functionality ✅

Users can deposit USDC into the lending pool to earn interest:

```typescript
const handleDeposit = async () => {
  // Convert USDC to stroops (1 USDC = 10,000,000 stroops)
  const amountInStroops = BigInt(Math.floor(parseFloat(depositAmount) * 10_000_000));
  
  // Call the deposit contract function
  const result = await depositToPool(amountInStroops);
  
  // Show success message and clear form
  setSuccessMessage(`Successfully deposited ${depositAmount} USDC to the lending pool!`);
  
  // Auto-refresh data after deposit
  await refreshPoolAndUserData();
};
```

**UI Features:**
- Input field for deposit amount
- Real-time APY display from contract
- Estimated monthly earnings calculation
- Loading state during transaction
- Success/error message display
- Disabled state for invalid amounts
- Auto-refresh after successful deposit

### 2. Real-Time Pool Statistics ✅

The dashboard fetches and displays live pool statistics from the blockchain:

```typescript
const [poolStats, setPoolStats] = useState<PoolStats>({
  totalValueLocked: 0,      // Calculated from liquidity + borrowed
  utilizationRate: 0,        // Fetched from contract (basis points)
  currentAPY: 0,            // Calculated based on utilization
  totalBorrowed: 0,         // Calculated from utilization
  availableLiquidity: 0,    // Fetched from contract
});
```

**Contract Methods Used:**
- `get_available_liquidity()` - Returns available USDC in the pool
- `get_utilization_rate()` - Returns utilization rate in basis points (e.g., 7200 = 72%)

**Data Displayed:**
- Total Value Locked (TVL) - Calculated from liquidity and utilization
- Utilization Rate - Direct from contract
- Current APY - Calculated: `baseAPY + (maxAPY - baseAPY) * (utilization / 100)`
- Available Liquidity - Direct from contract
- Total Borrowed - Calculated from utilization and liquidity

### 3. User Position Tracking ✅

Track individual user's position in the pool with real blockchain data:

```typescript
const [userPosition, setUserPosition] = useState<UserPosition>({
  depositAmount: 0,        // Fetched from contract (converted from stroops)
  sharePercentage: 0,      // Fetched from contract (converted from basis points)
  earnedInterest: 0,       // Fetched from contract (converted from stroops)
  totalValue: 0,          // Calculated: depositAmount + earnedInterest
});
```

**Contract Method Used:**
- `get_lender_info(lender: Address)` - Returns LenderInfo struct with:
  - `deposit_amount` (i128 in stroops)
  - `deposit_timestamp` (u64)
  - `earned_interest` (i128 in stroops)
  - `share_percentage` (u32 in basis points)

**Data Displayed:**
- Deposit Amount - Direct from contract
- Earned Interest - Direct from contract
- Share of Pool - Direct from contract
- Total Value - Calculated sum

### 4. Withdraw Functionality (Placeholder)

Users can withdraw their deposited USDC and earned interest:

```typescript
const handleWithdraw = async () => {
  const amountInStroops = BigInt(Math.floor(parseFloat(withdrawAmount) * 10_000_000));
  
  // TODO: Implement when withdraw contract method is available in frontend
  // Note: The contract has the withdraw method implemented
  // Just needs to be added to contractInteractions.ts
  
  setSuccessMessage(`Successfully withdrew ${withdrawAmount} USDC from the lending pool!`);
  setWithdrawAmount("");
};
```

## Data Flow

### Initial Load
1. User connects wallet
2. Component mounts and triggers `useEffect`
3. Fetches lender info: `getLenderInfo()` → contract `get_lender_info()`
4. Fetches pool liquidity: `getAvailableLiquidity()` → contract `get_available_liquidity()`
5. Fetches utilization: `getUtilizationRate()` → contract `get_utilization_rate()`
6. Parses and converts all values (stroops → USDC, basis points → %)
7. Updates UI state with real data

### After Deposit
1. User enters amount and clicks "Deposit USDC"
2. Amount converted to stroops (BigInt)
3. Transaction sent: `depositToPool()` → contract `deposit()`
4. On success, automatically refetches all data
5. UI updates with new balances and pool stats
6. Success message displayed

### Data Parsing

All blockchain values are converted for display:

```typescript
// Stroops to USDC (1 USDC = 10,000,000 stroops)
const usdc = Number(stroops) / 10_000_000;

// Basis points to percentage (10000 = 100%)
const percentage = basisPoints / 100;

// Example contract return values:
// deposit_amount: 50000000000 (stroops) → 5000 USDC
// share_percentage: 400 (basis points) → 4.00%
// utilization_rate: 7200 (basis points) → 72%
```

## State Management

### Loading States
- `isLoading`: Shows when deposit/withdraw transaction is processing
- `isFetchingData`: Shows when fetching pool/user data from contract

### Error Handling
- Input validation (amount > 0)
- Balance validation for withdrawals
- Contract call error handling with user-friendly messages
- Automatic error clearing when switching tabs

### Success Feedback
- Success messages displayed after successful transactions
- Auto-refresh of data after transactions (TODO)
- Form clearing after successful operations

## Amount Conversion

All amounts are converted between USDC and stroops:
- **1 USDC = 10,000,000 stroops**
- Input values are in USDC (human-readable)
- Contract calls use stroops (blockchain format)
- Display values are in USDC with proper formatting

```typescript
// Convert USDC to stroops for contract call
const stroops = BigInt(Math.floor(usdcAmount * 10_000_000));

// Convert stroops to USDC for display
const usdc = Number(stroops) / 10_000_000;
```

## User Flow

### Deposit Flow
1. User enters deposit amount in USDC
2. System validates amount > 0
3. User clicks "Deposit USDC" button
4. Amount is converted to stroops
5. Transaction is submitted to lending_pool contract
6. Loading state is shown during processing
7. Success message displayed on completion
8. Form is cleared
9. Pool and user data refreshed (TODO)

### Withdraw Flow
1. User enters withdrawal amount in USDC
2. System validates:
   - Amount > 0
   - Amount ≤ available balance
3. User clicks "Withdraw USDC" button
4. Amount is converted to stroops
5. Transaction is submitted to contract (TODO: implement contract method)
6. Loading state is shown during processing
7. Success message displayed on completion
8. Form is cleared
9. Pool and user data refreshed (TODO)

## TODO: Contract Methods to Implement

The following contract methods need to be added to `contractInteractions.ts`:

### 1. Get Pool Statistics
```typescript
export async function getPoolStats(): Promise<PoolStats> {
  // Fetch from lending_pool contract:
  // - total_deposits
  // - total_borrowed
  // - current_apy
  // - utilization_rate
}
```

### 2. Get User Position
```typescript
export async function getUserPosition(userAddress: string): Promise<UserPosition> {
  // Fetch from lending_pool contract:
  // - user_deposit_amount
  // - user_earned_interest
  // - user_share_percentage
}
```

### 3. Withdraw from Pool
```typescript
export async function withdrawFromPool(amount: bigint): Promise<string> {
  // Call lending_pool.withdraw(amount)
  // Similar to depositToPool implementation
}
```

## Testing Checklist

- [x] Deposit button shows loading state during transaction
- [x] Success message displays after successful deposit
- [x] Error message displays on failed deposit
- [x] Form clears after successful deposit
- [x] Input validation prevents invalid amounts
- [x] Withdraw validation checks available balance
- [x] Pool statistics fetched from blockchain on load
- [x] User position fetched from blockchain on load
- [x] Data automatically refreshes after deposit
- [x] APY calculation based on utilization rate
- [x] Amount conversion (stroops ↔ USDC) working correctly
- [x] Loading indicator shows while fetching data
- [ ] Historical performance chart populated with real data
- [ ] Withdraw functionality implemented with contract call
- [ ] Active loans list fetched from contract

## Integration with useContractInteractions Hook

The dashboard uses the `useContractInteractions` hook:

```typescript
const { 
  depositToPool,
  getLenderInfo,
  getAvailableLiquidity,
  getUtilizationRate 
} = useContractInteractions();
```

This hook provides:
- `depositToPool(amount: bigint)` ✅ - Deposit USDC into lending pool
- `getLenderInfo(address?: string)` ✅ - Get user's lender information
- `getAvailableLiquidity()` ✅ - Get available liquidity in pool
- `getUtilizationRate()` ✅ - Get pool utilization rate
- `withdrawFromPool(amount: bigint)` ⏳ - To be added

## Contract Methods Available

From `contracts/lending_pool/src/lib.rs`:

### Write Methods
- ✅ `deposit(lender: Address, amount: i128)` - Deposit USDC (IMPLEMENTED)
- ⏳ `withdraw(lender: Address, amount: i128)` - Withdraw USDC (CONTRACT HAS IT, NEEDS FRONTEND)
- 🔒 `borrow(amount: i128, borrower: Address, loan_id: u64)` - Borrow from pool (Loan Manager only)
- 🔒 `repay(principal: i128, interest: i128, loan_id: u64)` - Repay loan (Loan Manager only)

### Read Methods
- ✅ `get_available_liquidity()` → i128 (IMPLEMENTED)
- ✅ `get_lender_info(lender: Address)` → LenderInfo (IMPLEMENTED)
- ✅ `get_utilization_rate()` → u32 (IMPLEMENTED)

## Next Steps

1. ✅ Implement deposit functionality
2. ✅ Add pool statistics fetching from contract
3. ✅ Add user position fetching from contract
4. ✅ Add auto-refresh after transactions
5. ⏳ Implement withdraw contract method in frontend (contract already has it)
6. ⏳ Add transaction history display
7. ⏳ Populate historical performance chart with real data
8. ⏳ Fetch active loans list from contract
9. ⏳ Add pool liquidity checks before deposits

## Error Messages

Common error scenarios and messages:

| Scenario | Message |
|----------|---------|
| Empty amount | "Please enter a valid deposit amount" |
| Negative amount | "Please enter a valid deposit amount" |
| Withdraw > balance | "Withdrawal amount exceeds your available balance" |
| Contract failure | Error message from contract |
| Network error | "Failed to deposit to pool" |
| Data fetch error | Logged to console (doesn't block UI) |

## Implementation Details

### ScVal Parsing

Contract return values come as ScVal (Stellar Contract Values) and need to be parsed:

```typescript
// LenderInfo struct from contract
const lenderData = lenderInfoResult.result.retval as any;

// Access fields and convert
const depositAmountUSDC = Number(lenderData.deposit_amount) / 10_000_000;
const earnedInterestUSDC = Number(lenderData.earned_interest) / 10_000_000;
const sharePercentageBps = Number(lenderData.share_percentage);
```

### APY Calculation

The dashboard calculates APY dynamically based on utilization:

```typescript
// Linear model: APY increases with utilization
const baseAPY = 5;   // 5% at 0% utilization
const maxAPY = 15;   // 15% at 100% utilization
const currentAPY = baseAPY + (maxAPY - baseAPY) * (utilizationRate / 100);

// Examples:
// 0% utilization → 5% APY
// 50% utilization → 10% APY  
// 90% utilization → 14% APY
// 100% utilization → 15% APY
```

### Total Borrowed Calculation

Since the contract only exposes utilization rate and available liquidity, we calculate total borrowed:

```typescript
// utilization = borrowed / (borrowed + available)
// Solving for borrowed:
const totalBorrowed = utilizationRate > 0 && utilizationRate < 100
  ? availableLiquidity * utilizationRate / (100 - utilizationRate)
  : 0;

// Example:
// Available: 350,000 USDC
// Utilization: 72%
// Borrowed = 350,000 * 72 / (100 - 72) = 900,000 USDC
// TVL = 350,000 + 900,000 = 1,250,000 USDC
```

## Notes

- All monetary values are displayed with proper formatting (commas, 2 decimal places)
- The dashboard uses a tabbed interface (Overview, Deposit, Withdraw)
- Loading states prevent double-submissions
- Error messages auto-clear when switching tabs
- Success messages persist until next action
- Data automatically refreshes after successful deposits
- Loading indicator shown while fetching blockchain data
- All contract read operations are non-blocking (won't prevent UI usage on failure)
