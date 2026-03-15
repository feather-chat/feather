import { apiClient, throwIfError } from '@enzyme/api-client';

export const serverApi = {
  getServerInfo: () => throwIfError(apiClient.GET('/server-info')),
};
