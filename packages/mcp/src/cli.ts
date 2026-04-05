#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

type SetupMode = "npx" | "local";

type SetupOptions = {
	mode: SetupMode;
	apiUrl: string;
	privateKey?: string;
	network: string;
	maxPayment: string;
	configPath: string;
	packageName: string;
	localEntry: string;
	dryRun: boolean;
};

function getDefaultClaudeConfigPath(): string {
	if (process.env["CLAUDE_CONFIG_PATH"]) {
		return path.resolve(process.env["CLAUDE_CONFIG_PATH"]);
	}

	if (process.platform === "darwin") {
		return path.join(
			os.homedir(),
			"Library",
			"Application Support",
			"Claude",
			"claude_desktop_config.json",
		);
	}

	if (process.platform === "win32") {
		return path.join(os.homedir(), "AppData", "Roaming", "Claude", "claude_desktop_config.json");
	}

	return path.join(os.homedir(), ".config", "Claude", "claude_desktop_config.json");
}

function parseArgs(argv: string[]): { command?: string; options: Partial<SetupOptions> } {
	const options: Partial<SetupOptions> = {};
	let command: string | undefined;

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];

		if (!command && !arg.startsWith("-")) {
			command = arg;
			continue;
		}

		if (arg === "--mode") {
			options.mode = argv[index + 1] === "local" ? "local" : "npx";
			index += 1;
			continue;
		}

		if (arg === "--api-url") {
			options.apiUrl = argv[index + 1];
			index += 1;
			continue;
		}

		if (arg === "--private-key") {
			options.privateKey = argv[index + 1];
			index += 1;
			continue;
		}

		if (arg === "--network") {
			options.network = argv[index + 1];
			index += 1;
			continue;
		}

		if (arg === "--max-payment") {
			options.maxPayment = argv[index + 1];
			index += 1;
			continue;
		}

		if (arg === "--config-path") {
			options.configPath = argv[index + 1];
			index += 1;
			continue;
		}

		if (arg === "--package") {
			options.packageName = argv[index + 1];
			index += 1;
			continue;
		}

		if (arg === "--entry") {
			options.localEntry = argv[index + 1];
			index += 1;
			continue;
		}

		if (arg === "--dry-run") {
			options.dryRun = true;
		}
	}

	return { command, options };
}

function resolveSetupOptions(partial: Partial<SetupOptions>): SetupOptions {
	return {
		mode: partial.mode ?? "npx",
		apiUrl: partial.apiUrl ?? process.env["WALLETLENS_API_URL"] ?? "https://api.walletlens.online",
		privateKey: partial.privateKey ?? process.env["AGENT_PRIVATE_KEY"],
		network: partial.network ?? process.env["NETWORK"] ?? "base-sepolia",
		maxPayment: partial.maxPayment ?? process.env["X402_MAX_PAYMENT_USDC"] ?? "10",
		configPath: partial.configPath ?? getDefaultClaudeConfigPath(),
		packageName: partial.packageName ?? "@walletlens/mcp",
		localEntry: partial.localEntry ?? path.resolve(process.cwd(), "dist", "index.js"),
		dryRun: partial.dryRun ?? false,
	};
}

function buildClaudeConfig(options: SetupOptions): Record<string, unknown> {
	const serverConfig =
		options.mode === "local"
			? {
					command: "node",
					args: [options.localEntry],
				}
			: {
					command: "npx",
					args: ["-y", options.packageName],
				};

	return {
		preferences: {
			coworkScheduledTasksEnabled: false,
			ccdScheduledTasksEnabled: false,
			coworkWebSearchEnabled: true,
			sidebarMode: "chat",
		},
		mcpServers: {
			walletlens: {
				...serverConfig,
				env: {
					WALLETLENS_API_URL: options.apiUrl,
					AGENT_PRIVATE_KEY: options.privateKey,
					NETWORK: options.network,
					X402_MAX_PAYMENT_USDC: options.maxPayment,
				},
			},
		},
	};
}

async function setupClaudeConfig(options: SetupOptions): Promise<void> {
	if (!options.privateKey) {
		throw new Error(
			"AGENT_PRIVATE_KEY is required for setup. Pass --private-key or export AGENT_PRIVATE_KEY before running setup.",
		);
	}

	const config = buildClaudeConfig(options);
	const configText = `${JSON.stringify(config, null, 2)}\n`;

	if (options.dryRun) {
		process.stdout.write(configText);
		return;
	}

	await fs.mkdir(path.dirname(options.configPath), { recursive: true });
	await fs.writeFile(options.configPath, configText, "utf8");

	console.log(`Wrote Claude Desktop config to ${options.configPath}`);
	console.log("Restart Claude Desktop to load WalletLens MCP.");
}

async function main(): Promise<void> {
	const { command, options } = parseArgs(process.argv.slice(2));

	if (command === "setup") {
		await setupClaudeConfig(resolveSetupOptions(options));
		return;
	}

	await import("./index.js");
}

void main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
