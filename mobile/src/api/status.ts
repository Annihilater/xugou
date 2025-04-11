import api from './client';
import { API_ENDPOINTS } from '../config/api';
import { Monitor } from './monitors';
import { Agent } from './agents';

// 状态页配置类型
export interface StatusPageConfig {
  title: string;
  description: string;
  logoUrl: string;
  customCss: string;
  monitors: Array<{
    id: number;
    name: string;
    selected: boolean;
  }>;
  agents: Array<{
    id: number;
    name: string;
    selected: boolean;
  }>;
}

// 状态页数据类型
export interface StatusPageData {
  title: string;
  description: string;
  logoUrl: string;
  customCss: string;
  monitors: Monitor[];
  agents: Agent[];
}

// 状态页更新参数
export interface UpdateStatusPageParams {
  title: string;
  description: string;
  logoUrl: string;
  customCss: string;
  monitors: number[];
  agents: number[];
}

// 状态页API服务
const statusService = {
  // 获取状态页配置
  getStatusConfig: async (): Promise<StatusPageConfig | null> => {
    try {
      const response = await api.get(API_ENDPOINTS.STATUS_CONFIG);
      
      if (response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('获取状态页配置失败', error);
      return null;
    }
  },
  
  // 更新状态页配置
  updateStatusConfig: async (params: UpdateStatusPageParams): Promise<boolean> => {
    try {
      const response = await api.post(API_ENDPOINTS.STATUS_CONFIG, params);
      
      return response.data.success;
    } catch (error) {
      console.error('更新状态页配置失败', error);
      return false;
    }
  },
  
  // 获取状态页数据
  getStatusData: async (): Promise<StatusPageData | null> => {
    try {
      const response = await api.get(API_ENDPOINTS.STATUS_DATA);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('获取状态页数据失败', error);
      return null;
    }
  },
};

export default statusService; 