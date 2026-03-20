import { apiClient, throwIfError } from '../client';

export const serverApi = {
  getServerInfo: () => throwIfError(apiClient.GET('/server-info')),
};
