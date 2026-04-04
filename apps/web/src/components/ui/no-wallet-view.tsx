export function NoWalletView() {
  return (
    <div className="min-h-screen bg-[#080b10] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-3">
          Connect your wallet to continue
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Payment requires a connected wallet with USDC on Base.
        </p>
      </div>
    </div>
  );
}
