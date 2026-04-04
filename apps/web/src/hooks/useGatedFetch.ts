import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useX402Fetch } from "./useX402";

type GatedState<T> =
  | { status: "loading" }
  | { status: "no-wallet" }
  | { status: "done"; data: T }
  | { status: "error"; message: string };

type UseGatedFetchOptions = {
  url: string;
  body: Record<string, unknown>;
  enabled?: boolean;
};

export function useGatedFetch<T>({
  url,
  body,
  enabled = true,
}: UseGatedFetchOptions): GatedState<T> {
  const { status: sessionStatus } = useSession();
  const x402Fetch = useX402Fetch();
  const [state, setState] = useState<GatedState<T>>({ status: "loading" });

  // Stable change detector for request payload
  const serializedBody = useMemo(() => JSON.stringify(body), [body]);

  useEffect(() => {
    // Wait for session to resolve before checking wallet
    // This prevents the no-wallet flash on first render
    if (sessionStatus === "loading") return;
    if (!enabled) return;

    if (!x402Fetch) {
      setState({ status: "no-wallet" });
      return;
    }

    let cancelled = false;

    const run = async () => {
      setState({ status: "loading" });
      try {
        const res = await x402Fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: serializedBody,
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
        if (!cancelled) setState({ status: "done", data: data.data as T });
      } catch (err) {
        if (!cancelled)
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Failed",
          });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [sessionStatus, x402Fetch, url, enabled, serializedBody]);

  return state;
}
