export function Footer() {
  return (
    <footer className="w-full py-8 bg-surface-dim border-t border-outline-variant/15">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-on-surface-variant">
          Powered by{" "}
          <a
            href="https://intel.arkham.com"
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Arkham
          </a>{" "}
          ·{" "}
          <a
            href="https://monkepay.xyz"
            className="hover:text-primary transition-colors cursor-pointer"
          >
            MonkePay
          </a>{" "}
          ·{" "}
          <a
            href="https://claude.ai"
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Claude
          </a>
        </p>
      </div>
    </footer>
  );
}
