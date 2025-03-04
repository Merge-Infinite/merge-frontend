import { useApiClient } from './useApiClient';
import { Wallet } from '../../../core';
import { useQuery } from 'react-query';
import { WebApiClient } from '../scripts/shared/ui-api-client';

export async function fetchWallets(apiClient: WebApiClient) {
  return await apiClient.callFunc<null, Wallet[]>('wallet', 'getWallets', null);
}

export function useWallets() {
  const apiClient = useApiClient();
  const { data, error, refetch, ...rest } = useQuery(
    ['wallet', 'getWallets'],
    () => fetchWallets(apiClient)
  );

  return {
    data,
    error,
    fetchWallets: refetch,
    ...rest,
  };
}
