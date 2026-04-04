import Link from "next/link";

export function ErrorView({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-[#080b10] flex items-center justify-center">
      <div className="bg-[#0d1117] border border-red-900/50 rounded-xl p-8 text-center max-w-md">
        <p className="text-red-400 mb-4">{error}</p>
        <Link href="/" className="text-[#00d4aa] hover:underline text-sm">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
