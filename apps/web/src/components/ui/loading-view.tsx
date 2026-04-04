export function LoadingView({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#080b10] flex items-center justify-center">
      <div className="text-center">
        <div className="text-[#00d4aa] text-lg mb-2 animate-pulse">
          {message}
        </div>
        <div className="text-gray-500 text-xs">This may take a few seconds</div>
      </div>
    </div>
  );
}
