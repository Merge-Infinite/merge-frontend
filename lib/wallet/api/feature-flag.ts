export interface FeatureFlagNetwork {
  explorer_url: string;
  full_node_url: string;
  graphql_url: string;
  on_maintenance: boolean;
  faucet_api: string;
  mint_example_nft_gas_budget: number;
  transfer_object_gas_budget: number;
  move_call_gas_budget: number;
  pay_coin_gas_budget: number;
  enable_staking: boolean;
  cetus_partner_id: string | null;
  enable_swap: boolean;
  enable_buy_crypto: boolean;
  enable_mint_example_nft: boolean;
  version_cache_timout_in_seconds: number;
  stake_gas_budget: number;
  sample_nft_object_id: string;
}
export interface FeatureFlagRes {
  available_networks: string[];
  networks: Record<string, FeatureFlagNetwork>;
  default_network: string;
  require_update_browser: boolean;
  campaign: Record<string, any> | null;
  minimal_versions: Versions;
  latest_versions: Versions;
}

export interface Versions {
  extension: string;
  ios: string;
  android: string;
  chrome?: string;
}
