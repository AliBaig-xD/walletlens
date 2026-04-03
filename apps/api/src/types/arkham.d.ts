interface ArkhamTag {
  id: string;
  label: string;
  chain: string;
  rank: number;
  disablePage: boolean;
  excludeEntities: boolean;
  tagParams?: string;
}

interface ArkhamEntity {
  id: string;
  name: string;
  type: string;
  twitter?: string;
  website?: string;
  crunchbase?: string;
  linkedin?: string;
  instagram?: string;
  service?: boolean;
  customized?: boolean;
  populatedTags?: ArkhamTag[];
}

interface ArkhamLabel {
  address: string;
  chainType: string;
  name: string;
  note?: string;
}

export interface ArkhamEnrichedResponse {
  address: string;
  chain: string;
  contract: boolean;
  isUserAddress: boolean;
  isShielded?: boolean;
  service?: boolean;
  program?: boolean;
  arkhamEntity?: ArkhamEntity;
  arkhamLabel?: ArkhamLabel;
  predictedEntity?: ArkhamEntity;
  populatedTags?: ArkhamTag[];
  clusterIds?: string[];
  depositServiceID?: string;
}

export interface ArkhamTransfer {
  id: string;
  blockTimestamp: string;
  blockNumber: number;
  blockID: string;
  chain: string;
  unitValue: number;
  historicalUSD: number;
  tokenSymbol: string;
  tokenName?: string;
  tokenAddress?: string;
  tokenDecimals?: number;
  tokenId?: string;
  transactionHash: string;
  fromIsContract?: boolean;
  toIsContract?: boolean;
  fromAddress: {
    address: string;
    arkhamEntity?: { name: string };
    arkhamLabel?: { name: string };
  };
  toAddress: {
    address: string;
    arkhamEntity?: { name: string };
    arkhamLabel?: { name: string };
  };
}

export interface ArkhamTransfersResponse {
  transfers: ArkhamTransfer[];
}

export interface ArkhamEntitySummary {
  entityId: string;
  balanceUsd: number;
  volumeUsd: number;
  numAddresses: number;
  firstTx: string;
  lastTx: string;
}
