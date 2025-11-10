import React, { useState, useEffect } from "react";
import { useWallet } from "../hooks/useWallet";
import { useContractInteractions } from "../hooks/useContractInteractions";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Percent,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
} from "lucide-react";

interface PoolStats {
  totalValueLocked: number;
  utilizationRate: number;
  currentAPY: number;
  totalBorrowed: number;
  availableLiquidity: number;
}

interface UserPosition {
  depositAmount: number;
  sharePercentage: number;
  earnedInterest: number;
  totalValue: number;
}

const unwrapSimulationResult = (value: unknown): unknown => {
  if (
    value &&
    typeof value === "object" &&
    "result" in (value as Record<string, unknown>)
  ) {
    const resultField = (value as Record<string, unknown>).result;
    if (
      resultField &&
      typeof resultField === "object" &&
      "retval" in (resultField as Record<string, unknown>)
    ) {
      const retval = (resultField as Record<string, unknown>).retval;
      return retval ?? resultField;
    }
    return resultField ?? value;
  }
  return value;
};

const LenderDashboard: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const {
    depositToPool,
    withdrawFromPool,
    getLenderInfo,
    getAvailableLiquidity,
    getUtilizationRate,
    getLendingAllowance,
    enableLendingAllowance,
    mintTestUSDC,
  } = useContractInteractions();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [mintAmount, setMintAmount] = useState("100");
  const [activeTab, setActiveTab] = useState<
    "overview" | "deposit" | "withdraw"
  >("overview");

  // State for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [isAllowanceLoading, setIsAllowanceLoading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  // Pool and user data (will be fetched from contract)
  const [poolStats, setPoolStats] = useState<PoolStats>({
    totalValueLocked: 0,
    utilizationRate: 0,
    currentAPY: 0,
    totalBorrowed: 0,
    availableLiquidity: 0,
  });

  const [userPosition, setUserPosition] = useState<UserPosition>({
    depositAmount: 0,
    sharePercentage: 0,
    earnedInterest: 0,
    totalValue: 0,
  });

  const performanceData = [
    { month: "May", value: 50000 },
    { month: "Jun", value: 50420 },
    { month: "Jul", value: 50860 },
    { month: "Aug", value: 51310 },
    { month: "Sep", value: 51780 },
    { month: "Oct", value: 52260 },
    { month: "Nov", value: 52340 },
  ];

  const portfolioData = [
    {
      name: "Your Deposit",
      value: userPosition.depositAmount,
      color: "#6366f1",
    },
    {
      name: "Earned Interest",
      value: userPosition.earnedInterest,
      color: "#10b981",
    },
  ];

  const activeLoans: Array<{
    loanId: number;
    borrower: string;
    amount: number;
    interestRate: number;
    status: "Active" | "Pending" | "Repaid" | "Defaulted";
  }> = [];

  // Fetch pool and user data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!connected || !publicKey) return;

      setIsFetchingData(true);
      try {
        // Fetch lender info
        const lenderInfoResult = await getLenderInfo();
        console.log("Lender info result:", lenderInfoResult);

        const lenderPayload = unwrapSimulationResult(lenderInfoResult);
        if (lenderPayload && typeof lenderPayload === "object") {
          const lenderData = lenderPayload as Record<string, unknown>;
          const depositAmountUSDC =
            Number(lenderData["deposit_amount"] ?? 0) / 10_000_000;
          const earnedInterestUSDC =
            Number(lenderData["earned_interest"] ?? 0) / 10_000_000;
          const sharePercentageBps = Number(
            lenderData["share_percentage"] ?? 0,
          );

          setUserPosition({
            depositAmount: depositAmountUSDC,
            sharePercentage: sharePercentageBps / 100,
            earnedInterest: earnedInterestUSDC,
            totalValue: depositAmountUSDC + earnedInterestUSDC,
          });
        }

        // Fetch pool statistics
        const [liquidityResult, utilizationResult] = await Promise.all([
          getAvailableLiquidity(),
          getUtilizationRate(),
        ]);

        console.log("Liquidity result:", liquidityResult);
        console.log("Utilization result:", utilizationResult);

        const liquidityPayload = unwrapSimulationResult(liquidityResult);
        const utilizationPayload = unwrapSimulationResult(utilizationResult);

        const availableLiquidityUSDC = liquidityPayload
          ? Number(liquidityPayload) / 10_000_000
          : 0;

        const utilizationRateBps = utilizationPayload
          ? Number(utilizationPayload)
          : 0;

        const utilizationRate = utilizationRateBps / 100; // Convert basis points to percentage

        // Calculate APY based on utilization (simple model: base APY increases with utilization)
        // Example: 5% base APY at 0% utilization, 15% at 100% utilization
        const baseAPY = 5;
        const maxAPY = 15;
        const currentAPY =
          baseAPY + (maxAPY - baseAPY) * (utilizationRate / 100);

        // Calculate total borrowed from utilization rate
        // If utilization = borrowed / total, and available = total - borrowed
        // Then: borrowed = available * utilization / (1 - utilization)
        const totalBorrowed =
          utilizationRate > 0 && utilizationRate < 100
            ? (availableLiquidityUSDC * utilizationRate) /
              (100 - utilizationRate)
            : 0;

        const totalValueLocked = availableLiquidityUSDC + totalBorrowed;

        setPoolStats({
          totalValueLocked,
          utilizationRate,
          currentAPY,
          totalBorrowed,
          availableLiquidity: availableLiquidityUSDC,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        // Don't show error to user, just log it - they can still use the interface
      } finally {
        setIsFetchingData(false);
      }
    };

    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]); // Only re-run when wallet connection changes

  useEffect(() => {
    if (!connected || !publicKey) {
      setAllowance(0n);
      return;
    }

    let isMounted = true;

    const loadAllowance = async () => {
      setIsAllowanceLoading(true);
      try {
        const current = await getLendingAllowance();
        if (isMounted) {
          setAllowance(current);
        }
      } catch (err) {
        console.error("Error fetching allowance:", err);
      } finally {
        if (isMounted) {
          setIsAllowanceLoading(false);
        }
      }
    };

    void loadAllowance();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        <div className="glass rounded-2xl shadow-strong p-12 text-center max-w-md border border-gray-300 dark:border-white/10 backdrop-blur-xl">
          <AlertCircle className="w-16 h-16 text-warning-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Please Connect Your Wallet
          </h2>
          <p className="text-gray-700 dark:text-white">
            Connect your wallet to access the Lender Dashboard
          </p>
        </div>
      </div>
    );
  }

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError("Please enter a valid deposit amount");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Convert USDC amount to stroops (1 USDC = 10,000,000 stroops)
      const amountInStroops = BigInt(
        Math.floor(parseFloat(depositAmount) * 10_000_000),
      );

      console.log("Depositing to pool:", amountInStroops.toString(), "stroops");

      const result = await depositToPool(amountInStroops);

      console.log("Deposit successful:", result);
      setSuccessMessage(
        `Successfully deposited ${depositAmount} USDC to the lending pool!`,
      );
      setDepositAmount("");
      setAllowance((prev) =>
        prev > amountInStroops ? prev - amountInStroops : 0n,
      );

      // Refresh pool and user data after deposit
      try {
        const lenderInfoResult = await getLenderInfo();
        const lenderPayload = unwrapSimulationResult(lenderInfoResult);
        if (lenderPayload && typeof lenderPayload === "object") {
          const lenderData = lenderPayload as Record<string, unknown>;
          const depositAmountUSDC =
            Number(lenderData["deposit_amount"] ?? 0) / 10_000_000;
          const earnedInterestUSDC =
            Number(lenderData["earned_interest"] ?? 0) / 10_000_000;
          const sharePercentageBps = Number(
            lenderData["share_percentage"] ?? 0,
          );

          setUserPosition({
            depositAmount: depositAmountUSDC,
            sharePercentage: sharePercentageBps / 100,
            earnedInterest: earnedInterestUSDC,
            totalValue: depositAmountUSDC + earnedInterestUSDC,
          });
        }

        // Refresh pool stats
        const [liquidityResult, utilizationResult] = await Promise.all([
          getAvailableLiquidity(),
          getUtilizationRate(),
        ]);

        const liquidityPayload = unwrapSimulationResult(liquidityResult);
        const utilizationPayload = unwrapSimulationResult(utilizationResult);

        const availableLiquidityUSDC = liquidityPayload
          ? Number(liquidityPayload) / 10_000_000
          : 0;

        const utilizationRateBps = utilizationPayload
          ? Number(utilizationPayload)
          : 0;

        const utilizationRate = utilizationRateBps / 100;
        const baseAPY = 5;
        const maxAPY = 15;
        const currentAPY =
          baseAPY + (maxAPY - baseAPY) * (utilizationRate / 100);
        const totalBorrowed =
          utilizationRate > 0 && utilizationRate < 100
            ? (availableLiquidityUSDC * utilizationRate) /
              (100 - utilizationRate)
            : 0;
        const totalValueLocked = availableLiquidityUSDC + totalBorrowed;

        setPoolStats({
          totalValueLocked,
          utilizationRate,
          currentAPY,
          totalBorrowed,
          availableLiquidity: availableLiquidityUSDC,
        });
      } catch (refreshErr) {
        console.error("Error refreshing data:", refreshErr);
      }
    } catch (err) {
      console.error("Deposit failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to deposit to pool",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableAllowance = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsAllowanceLoading(true);

    try {
      const approvedAmount = await enableLendingAllowance();
      const approvedUsdc = Number(approvedAmount) / 10_000_000;
      setAllowance(approvedAmount);
      setSuccessMessage(
        `USDC spending enabled for ${approvedUsdc.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })} USDC.`,
      );
    } catch (err) {
      console.error("Failed to enable allowance:", err);
      setError(
        err instanceof Error ? err.message : "Failed to enable USDC spending",
      );
    } finally {
      setIsAllowanceLoading(false);
    }
  };

  const allowanceInUsdc = Number(allowance) / 10_000_000;

  const handleMintTestUSDC = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      setError("Enter a valid mint amount");
      return;
    }

    setIsMinting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const amountInStroops = BigInt(
        Math.floor(parseFloat(mintAmount) * 10_000_000),
      );
      await mintTestUSDC({ amount: amountInStroops });
      setSuccessMessage(
        `Minted ${parseFloat(mintAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC to your wallet.`,
      );
    } catch (err) {
      console.error("Mint failed:", err);
      setError(err instanceof Error ? err.message : "Failed to mint test USDC");
    } finally {
      setIsMinting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError("Please enter a valid withdrawal amount");
      return;
    }

    if (parseFloat(withdrawAmount) > userPosition.totalValue) {
      setError("Withdrawal amount exceeds your available balance");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Convert USDC amount to stroops (1 USDC = 10,000,000 stroops)
      const amountInStroops = BigInt(
        Math.floor(parseFloat(withdrawAmount) * 10_000_000),
      );

      console.log("Withdrawing from pool:", amountInStroops, "stroops");

      const result = await withdrawFromPool(amountInStroops);
      console.log("Withdrawal successful:", result);

      setSuccessMessage(
        `Successfully withdrew ${withdrawAmount} USDC from the lending pool!`,
      );
      setWithdrawAmount("");

      // Refresh pool and user data after withdrawal
      try {
        const lenderInfoResult = await getLenderInfo();
        const lenderPayload = unwrapSimulationResult(lenderInfoResult);
        if (lenderPayload && typeof lenderPayload === "object") {
          const lenderData = lenderPayload as Record<string, unknown>;
          const depositAmountUSDC =
            Number(lenderData["deposit_amount"] ?? 0) / 10_000_000;
          const earnedInterestUSDC =
            Number(lenderData["earned_interest"] ?? 0) / 10_000_000;
          const sharePercentageBps = Number(
            lenderData["share_percentage"] ?? 0,
          );

          setUserPosition({
            depositAmount: depositAmountUSDC,
            sharePercentage: sharePercentageBps / 100,
            earnedInterest: earnedInterestUSDC,
            totalValue: depositAmountUSDC + earnedInterestUSDC,
          });
        }

        const [liquidityResult, utilizationResult] = await Promise.all([
          getAvailableLiquidity(),
          getUtilizationRate(),
        ]);

        const liquidityPayload = unwrapSimulationResult(liquidityResult);
        const utilizationPayload = unwrapSimulationResult(utilizationResult);

        const availableLiquidityUSDC = liquidityPayload
          ? Number(liquidityPayload) / 10_000_000
          : 0;

        const utilizationRateBps = utilizationPayload
          ? Number(utilizationPayload)
          : 0;

        const utilizationRate = utilizationRateBps / 100;
        const baseAPY = 5;
        const maxAPY = 15;
        const currentAPY =
          baseAPY + (maxAPY - baseAPY) * (utilizationRate / 100);
        const totalBorrowed =
          utilizationRate > 0 && utilizationRate < 100
            ? (availableLiquidityUSDC * utilizationRate) /
              (100 - utilizationRate)
            : 0;
        const totalValueLocked = availableLiquidityUSDC + totalBorrowed;

        setPoolStats({
          totalValueLocked,
          utilizationRate,
          currentAPY,
          totalBorrowed,
          availableLiquidity: availableLiquidityUSDC,
        });
      } catch (refreshErr) {
        console.error("Error refreshing data after withdrawal:", refreshErr);
      }
    } catch (err) {
      console.error("Withdrawal failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to withdraw from pool",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none mx-auto">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Lender Dashboard
          </h1>
          <p className="text-gray-700 dark:text-white font-mono text-sm">
            {publicKey?.substring(0, 8)}...
            {publicKey?.substring(publicKey.length - 6)}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b-2 border-gray-300 dark:border-white/10">
          {[
            { key: "overview", label: "Overview" },
            { key: "deposit", label: "Deposit" },
            { key: "withdraw", label: "Withdraw" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-6 py-3 font-semibold transition-all duration-200 border-b-3 ${
                activeTab === tab.key
                  ? "text-cyan-400 border-cyan-400"
                  : "text-gray-700 dark:text-white border-transparent hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Loading State */}
            {isFetchingData && (
              <div className="glass rounded-xl shadow-soft p-12 border border-gray-300 dark:border-white/10 backdrop-blur-xl text-center">
                <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
                <p className="text-gray-700 dark:text-white">
                  Loading pool data...
                </p>
              </div>
            )}

            {/* Pool Statistics */}
            {!isFetchingData && (
              <div className="glass rounded-xl shadow-soft p-6 border border-gray-300 dark:border-white/10 backdrop-blur-xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Pool Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      icon: Wallet,
                      label: "Total Value Locked",
                      value: `$${poolStats.totalValueLocked.toLocaleString()}`,
                      color: "bg-emerald-500",
                    },
                    {
                      icon: Percent,
                      label: "Utilization Rate",
                      value: `${poolStats.utilizationRate}%`,
                      color: "bg-indigo-500",
                    },
                    {
                      icon: TrendingUp,
                      label: "Current APY",
                      value: `${poolStats.currentAPY}%`,
                      color: "bg-purple-500",
                    },
                    {
                      icon: DollarSign,
                      label: "Available Liquidity",
                      value: `$${poolStats.availableLiquidity.toLocaleString()}`,
                      color: "bg-orange-500",
                    },
                  ].map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={index}
                        className="glass rounded-xl p-6 group hover:shadow-md transition-all duration-300 border border-gray-300 dark:border-white/10 backdrop-blur-xl card-shine"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700 dark:text-white mb-1">
                              {stat.label}
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {stat.value}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* User Position */}
            {!isFetchingData && (
              <div className="glass rounded-xl shadow-soft p-6 border border-gray-300 dark:border-white/10 backdrop-blur-xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Your Position
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="glass bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-xl p-6 border border-emerald-500/20">
                    <h3 className="text-gray-700 dark:text-white text-sm font-medium mb-2">
                      Total Value
                    </h3>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                      ${userPosition.totalValue.toLocaleString()}
                    </p>
                    <div className="space-y-3">
                      {[
                        {
                          label: "Deposit Amount",
                          value: `$${userPosition.depositAmount.toLocaleString()}`,
                          color: "text-white",
                        },
                        {
                          label: "Earned Interest",
                          value: `+$${userPosition.earnedInterest.toLocaleString()}`,
                          color: "text-emerald-400",
                        },
                        {
                          label: "Share of Pool",
                          value: `${userPosition.sharePercentage}%`,
                          color: "text-white",
                        },
                      ].map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center glass bg-white/5 dark:bg-white/5 rounded-lg p-3 border border-gray-300 dark:border-white/10"
                        >
                          <span className="text-gray-700 dark:text-white font-medium">
                            {item.label}:
                          </span>
                          <span className={`font-bold ${item.color}`}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-center glass bg-white/5 dark:bg-white/5 rounded-xl p-6 border border-gray-300 dark:border-white/10">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={portfolioData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {portfolioData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) =>
                            `$${value.toLocaleString()}`
                          }
                          contentStyle={{
                            backgroundColor: "#1a1a2e",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
                            color: "#f1f5f9",
                          }}
                          labelStyle={{ color: "#f1f5f9" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Chart */}
            {!isFetchingData && (
              <div className="glass rounded-xl shadow-soft p-6 border border-gray-300 dark:border-white/10 backdrop-blur-xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Historical Performance
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      formatter={(value: number) =>
                        `$${value.toLocaleString()}`
                      }
                      contentStyle={{
                        backgroundColor: "#1a1a2e",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "0.5rem",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
                        color: "#f1f5f9",
                      }}
                      labelStyle={{ color: "#f1f5f9" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Active Loans Portfolio */}
            {!isFetchingData && (
              <div className="glass rounded-xl shadow-soft p-6 border border-gray-300 dark:border-white/10 backdrop-blur-xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Active Loans in Portfolio
                </h2>
                {activeLoans.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-300 dark:border-white/10">
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-white">
                            Loan ID
                          </th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-white">
                            Borrower
                          </th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-white">
                            Amount
                          </th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-white">
                            Interest Rate
                          </th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-white">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeLoans.map((loan) => (
                          <tr
                            key={loan.loanId}
                            className="border-b border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                          >
                            <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">
                              #{loan.loanId}
                            </td>
                            <td className="py-4 px-4 font-mono text-sm text-gray-700 dark:text-white">
                              {loan.borrower}
                            </td>
                            <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">
                              ${loan.amount.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-gray-700 dark:text-white">
                              {loan.interestRate}%
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-semibold border border-emerald-500/30">
                                {loan.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="glass bg-white/5 dark:bg-white/5 border border-white/10 rounded-xl p-6 text-center text-gray-700 dark:text-white">
                    You don’t have any active loans in your portfolio yet. Once
                    borrowers start repayments on loans you fund, they’ll show
                    up here.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Deposit Tab */}
        {activeTab === "deposit" && (
          <div className="max-w-2xl mx-auto">
            <div className="glass rounded-2xl shadow-strong p-8 border border-gray-300 dark:border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <ArrowUpCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Deposit USDC
                </h2>
              </div>
              <p className="text-gray-700 dark:text-white leading-relaxed mb-8">
                Deposit USDC into the lending pool to earn interest. Your funds
                will be used to provide loans to borrowers.
              </p>

              {/* Error Message */}
              {error && (
                <div className="glass bg-red-500/10 border-l-4 border-red-500 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-400">❌ {error}</p>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="glass bg-emerald-500/10 border-l-4 border-emerald-500 rounded-xl p-4 mb-6">
                  <p className="text-sm text-emerald-400">
                    ✅ {successMessage}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-3xl font-bold p-4 glass bg-white/5 dark:bg-white/5 border-2 border-gray-300 dark:border-white/20 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-500"
                />
                <p className="text-sm text-gray-700 dark:text-white mt-2">
                  Available Balance: 100,000 USDC
                </p>
              </div>

              <div className="glass bg-emerald-500/10 border-l-4 border-emerald-500 rounded-xl p-6 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-white">
                      Current APY:
                    </span>
                    <span className="text-xl font-bold text-emerald-400">
                      {poolStats.currentAPY}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">
                      Estimated Monthly Earnings:
                    </span>
                    <span className="text-xl font-bold text-emerald-400">
                      $
                      {(
                        ((parseFloat(depositAmount) || 0) *
                          poolStats.currentAPY) /
                        100 /
                        12
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass bg-cyan-500/10 border-l-4 border-cyan-500 rounded-xl p-6 mb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-cyan-200">
                      Allowance remaining for the lending pool
                    </p>
                    <p className="text-2xl font-semibold text-cyan-100">
                      {allowanceInUsdc.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      USDC
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleEnableAllowance}
                    disabled={isAllowanceLoading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-500 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAllowanceLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enabling...
                      </>
                    ) : (
                      "Enable USDC Spending"
                    )}
                  </button>
                </div>
                <p className="text-xs text-cyan-100/80 mt-3">
                  This approves the lending pool contract to transfer USDC from
                  your wallet up to the allowance amount. If you see an
                  allowance error, enable spending before depositing.
                </p>
              </div>

              <div className="glass bg-indigo-500/10 border-l-4 border-indigo-500 rounded-xl p-6 mb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="w-full sm:w-auto">
                    <label className="block text-sm font-semibold text-indigo-100 mb-2">
                      Mint testnet USDC
                    </label>
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={(event) => setMintAmount(event.target.value)}
                      min="0"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleMintTestUSDC}
                    disabled={isMinting}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMinting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Minting...
                      </>
                    ) : (
                      "Mint Test USDC"
                    )}
                  </button>
                </div>
                <p className="text-xs text-indigo-100/80 mt-3">
                  Mints test USDC directly to the connected wallet so you can
                  experiment with deposits. This action is only available in the
                  test environment.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDeposit}
                disabled={isLoading || !depositAmount}
                className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:scale-105 mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Deposit USDC"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Withdraw Tab */}
        {activeTab === "withdraw" && (
          <div className="max-w-2xl mx-auto">
            <div className="glass rounded-2xl shadow-strong p-8 border border-gray-300 dark:border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/50">
                  <ArrowDownCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Withdraw USDC
                </h2>
              </div>
              <p className="text-gray-700 dark:text-white leading-relaxed mb-8">
                Withdraw your deposited USDC and earned interest from the
                lending pool.
              </p>

              {/* Error Message */}
              {error && (
                <div className="glass bg-red-500/10 border-l-4 border-red-500 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-400">❌ {error}</p>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="glass bg-emerald-500/10 border-l-4 border-emerald-500 rounded-xl p-4 mb-6">
                  <p className="text-sm text-emerald-400">
                    ✅ {successMessage}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  max={userPosition.totalValue}
                  className="w-full text-3xl font-bold p-4 glass bg-white/5 dark:bg-white/5 border-2 border-gray-300 dark:border-white/20 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-500"
                />
                <p className="text-sm text-gray-700 dark:text-white mt-2">
                  Available to Withdraw: $
                  {userPosition.totalValue.toLocaleString()} USDC
                </p>
              </div>

              <div className="glass bg-white/5 rounded-xl p-6 mb-6 space-y-4 border border-white/10">
                {[
                  {
                    label: "Principal",
                    value: `$${userPosition.depositAmount.toLocaleString()}`,
                    color: "text-white",
                  },
                  {
                    label: "Interest Earned",
                    value: `$${userPosition.earnedInterest.toLocaleString()}`,
                    color: "text-emerald-400",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-3 border-b border-white/10 last:border-0"
                  >
                    <span className="text-gray-700 dark:text-white">
                      {item.label}:
                    </span>
                    <span className={`font-bold ${item.color}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t-2 border-indigo-500">
                  <span className="text-gray-900 dark:text-white font-semibold">
                    Total Available:
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${userPosition.totalValue.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isLoading || !withdrawAmount}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:scale-105 mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Withdraw USDC"
                )}
              </button>

              <div className="glass bg-indigo-500/10 border-l-4 border-indigo-500 rounded-xl p-4">
                <p className="text-sm text-indigo-300">
                  ℹ️ Withdrawals are subject to available pool liquidity.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LenderDashboard;
