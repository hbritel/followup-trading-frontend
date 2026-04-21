import type { OptionSpreadDto } from '@/types/dto';
import { mockOptionSpreads } from '@/data/optionSpreadsMock';

// Mock mode keeps the Options page renderable without a running backend
// so the UI can be reviewed end-to-end. Swap back to the real apiClient
// calls once the Phase 6.1 backend endpoints are available.
const simulateLatency = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const optionSpreadService = {
  detectSpreads: async (): Promise<OptionSpreadDto[]> => {
    await simulateLatency(800);
    return [...mockOptionSpreads];
  },

  getSpreads: async (status?: string): Promise<OptionSpreadDto[]> => {
    await simulateLatency(400);
    if (!status) return [...mockOptionSpreads];
    return mockOptionSpreads.filter((s) => s.status === status);
  },

  getSpreadDetail: async (id: string): Promise<OptionSpreadDto> => {
    await simulateLatency(300);
    const spread = mockOptionSpreads.find((s) => s.id === id);
    if (!spread) {
      throw new Error(`Spread ${id} not found`);
    }
    return spread;
  },
};
