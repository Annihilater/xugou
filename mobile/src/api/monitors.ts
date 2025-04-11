import axios from './client';
import { API_ENDPOINTS } from '../config/api';

// 监控类型
export interface Monitor {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
  interval: number;
  timeout: number;
  retries: number;
  status: 'up' | 'down' | 'unknown' | 'maintenance';
  lastChecked?: string;
  uptime?: number;
  responseTime?: number;
  response_time?: number;
  active?: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

// 监控状态历史记录类型
export interface MonitorStatusHistory {
  id: number;
  monitor_id: number;
  status: string;
  timestamp: string;
}

// 监控检查记录类型
export interface MonitorCheck {
  id: number;
  monitor_id: number;
  status: string;
  response_time?: number;
  status_code?: number;
  error?: string;
  checked_at: string;
}

// 创建监控参数
export interface CreateMonitorParams {
  name: string;
  url: string;
  method: string;
  interval?: number;
  timeout?: number;
  expectedStatus?: number;
  headers?: Record<string, string>;
  body?: string;
}

// 更新监控参数
export interface UpdateMonitorParams {
  name?: string;
  url?: string;
  method?: string;
  interval?: number;
  timeout?: number;
  expectedStatus?: number;
  headers?: Record<string, string>;
  body?: string;
  active?: boolean;
}

// 获取所有监控
export const getAllMonitors = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.MONITORS);
    return {
      success: true,
      monitors: response.data.monitors || []
    };
  } catch (error) {
    console.error('获取监控列表失败', error);
    return {
      success: false,
      message: '获取监控列表失败',
      monitors: []
    };
  }
};

// 获取单个监控详情
export const getMonitorById = async (id: string) => {
  try {
    const response = await axios.get(API_ENDPOINTS.MONITOR_DETAIL(Number(id)));
    return {
      success: true,
      monitor: response.data.monitor
    };
  } catch (error) {
    console.error(`获取监控 ${id} 详情失败`, error);
    return {
      success: false,
      message: '获取监控详情失败',
      monitor: null
    };
  }
};

// 创建新监控
export const createMonitor = async (monitorData: Partial<Monitor>) => {
  try {
    const response = await axios.post(API_ENDPOINTS.MONITORS, monitorData);
    return {
      success: true,
      monitor: response.data.monitor
    };
  } catch (error) {
    console.error('创建监控失败', error);
    return {
      success: false,
      message: '创建监控失败',
      monitor: null
    };
  }
};

// 更新监控
export const updateMonitor = async (id: string, monitorData: Partial<Monitor>) => {
  try {
    const response = await axios.put(API_ENDPOINTS.MONITOR_DETAIL(Number(id)), monitorData);
    return {
      success: true,
      monitor: response.data.monitor
    };
  } catch (error) {
    console.error(`更新监控 ${id} 失败`, error);
    return {
      success: false,
      message: '更新监控失败',
      monitor: null
    };
  }
};

// 删除监控
export const deleteMonitor = async (id: string) => {
  try {
    await axios.delete(API_ENDPOINTS.MONITOR_DETAIL(Number(id)));
    return {
      success: true
    };
  } catch (error) {
    console.error(`删除监控 ${id} 失败`, error);
    return {
      success: false,
      message: '删除监控失败'
    };
  }
};

// 获取监控历史
export const getMonitorHistory = async (id: number): Promise<MonitorStatusHistory[]> => {
  try {
    const response = await axios.get(API_ENDPOINTS.MONITOR_HISTORY(id));
    
    if (response.data.success) {
      return response.data.history || [];
    }
    
    return [];
  } catch (error) {
    console.error(`获取监控 ${id} 历史记录失败`, error);
    return [];
  }
};

// 获取监控检查记录
export const getMonitorChecks = async (id: number, limit: number = 10): Promise<MonitorCheck[]> => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.MONITOR_CHECKS(id)}?limit=${limit}`);
    
    if (response.data.success) {
      return response.data.checks || [];
    }
    
    return [];
  } catch (error) {
    console.error(`获取监控 ${id} 检查记录失败`, error);
    return [];
  }
};

// 手动检查监控
export const checkMonitor = async (id: number): Promise<any> => {
  try {
    const response = await axios.post(API_ENDPOINTS.MONITOR_CHECK(id));
    
    if (response.data.success) {
      return response.data.result;
    }
    
    return null;
  } catch (error) {
    console.error(`手动检查监控 ${id} 失败`, error);
    return null;
  }
};

// Dashboard中使用的方法 - 为了兼容性添加
export const getMonitors = async (): Promise<Monitor[]> => {
  try {
    console.log('调用getMonitors方法获取监控列表');
    const result = await getAllMonitors();
    if (result.success && result.monitors) {
      console.log(`成功获取${result.monitors.length}个监控`);
      return result.monitors;
    }
    console.warn('监控列表为空或获取失败');
    return [];
  } catch (error) {
    console.error('获取监控列表异常:', error);
    return [];
  }
};

// 创建监控服务对象
const monitorService = {
  getAllMonitors,
  getMonitorById,
  createMonitor,
  updateMonitor,
  deleteMonitor,
  getMonitorHistory,
  getMonitorChecks,
  checkMonitor,
  getMonitors, // 为了兼容Dashboard添加
};

export default monitorService; 