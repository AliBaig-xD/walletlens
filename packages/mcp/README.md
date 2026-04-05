# WalletLens MCP

WalletLens MCP server exposes three paid wallet intelligence tools over stdio:

- analyze_wallet
- get_transfers
- generate_report

## Requirements

- Node.js 18+
- Access to a running WalletLens API
- A funded agent wallet private key (0x-prefixed 32-byte hex)

## Environment Variables

- WALLETLENS_API_URL: WalletLens API base URL (default: https://api.walletlens.online)
- AGENT_PRIVATE_KEY: 0x-prefixed private key used for x402 payments
- NETWORK: base or base-sepolia (default: base-sepolia)
- X402_MAX_PAYMENT_USDC: max per-request payment cap in USDC units (default: 10)

## Local Run

1. Build:

   npm run build

2. Start:

   npm run start

## Claude Desktop (npx-first)

Fastest install:

```bash
AGENT_PRIVATE_KEY=0xYOUR_PRIVATE_KEY npx -y @walletlens/mcp setup
```

That writes the Claude Desktop config for you with the npx launcher.

If you want to see or customize the generated JSON, run:

```bash
npx -y @walletlens/mcp setup --dry-run
```

Manual Claude Desktop config fallback:

{
  "mcpServers": {
    "walletlens": {
      "command": "npx",
      "args": ["-y", "@walletlens/mcp"],
      "env": {
        "WALLETLENS_API_URL": "https://api.walletlens.online",
        "AGENT_PRIVATE_KEY": "0xYOUR_PRIVATE_KEY",
        "NETWORK": "base-sepolia",
        "X402_MAX_PAYMENT_USDC": "10"
      }
    }
  }
}

## Fallback (no npx)

If you need a deterministic local fallback for demos:

- command: node
- args: ["/absolute/path/to/packages/mcp/dist/index.js"]

To write a local fallback config instead of npx:

```bash
AGENT_PRIVATE_KEY=0xYOUR_PRIVATE_KEY npx -y @walletlens/mcp setup --mode local --entry /absolute/path/to/packages/mcp/dist/index.js
```
