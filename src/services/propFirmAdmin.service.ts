import apiClient from './apiClient';
import type {
  PropFirmDashboardDto,
  TraderSummaryDto,
  AddTraderRequestDto,
  CreateTenantRequestDto,
} from '@/types/dto';

export const propFirmAdminService = {
  getDashboard: async (): Promise<PropFirmDashboardDto> => {
    const response = await apiClient.get<PropFirmDashboardDto>('/propfirm-admin/dashboard');
    return response.data;
  },

  getTraders: async (): Promise<TraderSummaryDto[]> => {
    const response = await apiClient.get<TraderSummaryDto[]>('/propfirm-admin/traders');
    return response.data;
  },

  getTraderMetrics: async (userId: string): Promise<TraderSummaryDto> => {
    const response = await apiClient.get<TraderSummaryDto>(
      `/propfirm-admin/traders/${userId}/metrics`,
    );
    return response.data;
  },

  addTrader: async (data: AddTraderRequestDto): Promise<void> => {
    await apiClient.post('/propfirm-admin/traders', data);
  },

  removeTrader: async (userId: string): Promise<void> => {
    await apiClient.delete(`/propfirm-admin/traders/${userId}`);
  },

  createTenant: async (data: CreateTenantRequestDto): Promise<void> => {
    await apiClient.post('/propfirm-admin/tenants', data);
  },
};
