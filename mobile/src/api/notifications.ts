import axios from './client';
import { API_ENDPOINTS } from '../config/api';

// 通知渠道类型
export interface NotificationChannel {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: any;
}

// 通知模板类型
export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  isDefault: boolean;
  type: string;
}

// 特定客户端通知设置
interface AgentNotificationSettings {
  enabled: boolean;
  onOffline: boolean;
  onRecovery: boolean;
  onCpuThreshold: boolean;
  cpuThreshold: number;
  onMemoryThreshold: boolean;
  memoryThreshold: number;
  onDiskThreshold: boolean;
  diskThreshold: number;
  channels: string[];
  overrideGlobal?: boolean;
}

// 特定监控通知设置
interface MonitorNotificationSettings {
  enabled: boolean;
  onDown: boolean;
  onRecovery: boolean;
  onResponseTimeThreshold: boolean;
  responseTimeThreshold: number;
  onConsecutiveFailure: boolean;
  consecutiveFailureThreshold: number;
  channels: string[];
  overrideGlobal?: boolean;
}

// 通知设置类型
export interface NotificationSettings {
  monitors: {
    enabled: boolean;
    onDown: boolean;
    onRecovery: boolean;
    onResponseTimeThreshold: boolean;
    responseTimeThreshold: number;
    onConsecutiveFailure: boolean;
    consecutiveFailureThreshold: number;
    channels: string[];
  };
  agents: {
    enabled: boolean;
    onOffline: boolean;
    onRecovery: boolean;
    onCpuThreshold: boolean;
    cpuThreshold: number;
    onMemoryThreshold: boolean;
    memoryThreshold: number;
    onDiskThreshold: boolean;
    diskThreshold: number;
    channels: string[];
  };
  specificMonitors: Record<string, MonitorNotificationSettings>;
  specificAgents: Record<string, AgentNotificationSettings>;
}

// 获取通知配置
export const getNotificationConfig = async () => {
  try {
    console.log('尝试获取通知配置，URL路径:', API_ENDPOINTS.NOTIFICATIONS);
    const response = await axios.get(API_ENDPOINTS.NOTIFICATIONS);
    console.log('通知配置原始响应:', JSON.stringify(response.data).substring(0, 200) + '...');
    
    // 检查响应格式并尝试统一
    let formattedData = response.data;
    
    // 如果响应不包含标准字段，尝试构造标准响应
    if (!response.data.hasOwnProperty('success')) {
      console.log('检测到非标准响应格式，尝试适配...');
      formattedData = {
        success: true,
        data: {
          settings: response.data,
          channels: response.data.channels || []
        }
      };
    }
    
    // 记录处理后的数据
    console.log('通知配置格式化后:', JSON.stringify(formattedData).substring(0, 200) + '...');
    
    return {
      success: true,
      data: formattedData.data || formattedData,
      message: '获取通知配置成功'
    };
  } catch (error: any) {
    console.error('获取通知配置失败', error);
    
    // 提供更详细的错误信息
    let errorMessage = '网络请求失败';
    let errorDetails = '';
    
    if (error.response) {
      // 服务器返回了错误状态码
      errorMessage = `服务器返回错误(${error.response.status})`;
      try {
        errorDetails = JSON.stringify(error.response.data);
      } catch (e) {
        errorDetails = String(error.response.data);
      }
      console.error('错误详情:', errorDetails);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMessage = '服务器没有响应';
      console.error('请求已发送但没有响应:', error.request);
    } else {
      // 请求过程中出现了错误
      errorMessage = error.message || '未知错误';
      console.error('请求错误:', errorMessage);
    }
    
    console.warn('将使用模拟数据代替实际数据');
    
    return {
      success: false,
      message: `${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`,
      data: null
    };
  }
};

// 尝试将ID字符串转换为数字
function safeParseInt(value: string | number): number | null {
  if (typeof value === 'number') return value;
  
  try {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  } catch (e) {
    return null;
  }
}

// 保存通知设置
export const saveNotificationSettings = async (settings: NotificationSettings) => {
  try {
    console.log('准备保存通知设置...');
    console.log('monitors设置:', JSON.stringify(settings.monitors).substring(0, 200));
    console.log('agents设置:', JSON.stringify(settings.agents).substring(0, 200));
    console.log('特定监控数量:', Object.keys(settings.specificMonitors || {}).length);
    console.log('特定客户端数量:', Object.keys(settings.specificAgents || {}).length);
    
    // 创建请求队列，用于批量保存设置
    const saveRequests: Promise<any>[] = [];
    
    // 转换全局监控设置
    const monitorSettings = {
      target_type: 'global-monitor',
      enabled: Boolean(settings.monitors.enabled),
      on_down: Boolean(settings.monitors.onDown),
      on_recovery: Boolean(settings.monitors.onRecovery),
      on_response_time_threshold: Boolean(settings.monitors.onResponseTimeThreshold),
      response_time_threshold: Number(settings.monitors.responseTimeThreshold || 1000),
      on_consecutive_failure: Boolean(settings.monitors.onConsecutiveFailure),
      consecutive_failure_threshold: Number(settings.monitors.consecutiveFailureThreshold || 3),
      channels: JSON.stringify(settings.monitors.channels || []),
      override_global: false
    };
    
    console.log('发送全局监控设置:', JSON.stringify(monitorSettings));
    saveRequests.push(
      axios.post(API_ENDPOINTS.NOTIFICATION_SETTINGS, monitorSettings)
    );

    // 转换全局客户端设置
    const agentSettings = {
      target_type: 'global-agent',
      enabled: Boolean(settings.agents.enabled),
      on_offline: Boolean(settings.agents.onOffline),
      on_recovery: Boolean(settings.agents.onRecovery),
      on_cpu_threshold: Boolean(settings.agents.onCpuThreshold),
      cpu_threshold: Number(settings.agents.cpuThreshold || 90),
      on_memory_threshold: Boolean(settings.agents.onMemoryThreshold),
      memory_threshold: Number(settings.agents.memoryThreshold || 85),
      on_disk_threshold: Boolean(settings.agents.onDiskThreshold),
      disk_threshold: Number(settings.agents.diskThreshold || 90),
      channels: JSON.stringify(settings.agents.channels || []),
      override_global: false
    };
    
    console.log('发送全局客户端设置:', JSON.stringify(agentSettings));
    saveRequests.push(
      axios.post(API_ENDPOINTS.NOTIFICATION_SETTINGS, agentSettings)
    );

    // 处理特定监控设置
    for (const monitorId in settings.specificMonitors) {
      const monitorSetting = settings.specificMonitors[monitorId];
      
      if (!monitorSetting.overrideGlobal) {
        console.log(`跳过未启用覆盖的监控设置: ${monitorId}`);
        continue;
      }
      
      try {
        const target_id = safeParseInt(monitorId);
        if (target_id === null) {
          console.warn(`无效的监控ID无法转换为数字: ${monitorId}，跳过该设置`);
          continue;
        }

        const specificMonitorSettings = {
          target_type: 'monitor',
          target_id,
          enabled: Boolean(monitorSetting.enabled),
          on_down: Boolean(monitorSetting.onDown),
          on_recovery: Boolean(monitorSetting.onRecovery),
          on_response_time_threshold: Boolean(monitorSetting.onResponseTimeThreshold),
          response_time_threshold: Number(monitorSetting.responseTimeThreshold || 1000),
          on_consecutive_failure: Boolean(monitorSetting.onConsecutiveFailure),
          consecutive_failure_threshold: Number(monitorSetting.consecutiveFailureThreshold || 3),
          channels: JSON.stringify(monitorSetting.channels || []),
          override_global: Boolean(monitorSetting.overrideGlobal)
        };
        
        console.log(`发送特定监控设置 ${monitorId}:`, JSON.stringify(specificMonitorSettings));
        saveRequests.push(
          axios.post(API_ENDPOINTS.NOTIFICATION_SETTINGS, specificMonitorSettings)
        );
      } catch (err) {
        console.error(`处理监控设置 ${monitorId} 时出错:`, err);
      }
    }

    // 处理特定客户端设置
    for (const agentId in settings.specificAgents) {
      const agentSetting = settings.specificAgents[agentId];
      
      if (!agentSetting.overrideGlobal) {
        console.log(`跳过未启用覆盖的客户端设置: ${agentId}`);
        continue;
      }
      
      try {
        const target_id = safeParseInt(agentId);
        if (target_id === null) {
          console.warn(`无效的客户端ID无法转换为数字: ${agentId}，跳过该设置`);
          continue;
        }

        const specificAgentSettings = {
          target_type: 'agent',
          target_id,
          enabled: Boolean(agentSetting.enabled),
          on_offline: Boolean(agentSetting.onOffline),
          on_recovery: Boolean(agentSetting.onRecovery),
          on_cpu_threshold: Boolean(agentSetting.onCpuThreshold),
          cpu_threshold: Number(agentSetting.cpuThreshold || 90),
          on_memory_threshold: Boolean(agentSetting.onMemoryThreshold),
          memory_threshold: Number(agentSetting.memoryThreshold || 85),
          on_disk_threshold: Boolean(agentSetting.onDiskThreshold),
          disk_threshold: Number(agentSetting.diskThreshold || 90),
          channels: JSON.stringify(agentSetting.channels || []),
          override_global: Boolean(agentSetting.overrideGlobal)
        };
        
        console.log(`发送特定客户端设置 ${agentId}:`, JSON.stringify(specificAgentSettings));
        saveRequests.push(
          axios.post(API_ENDPOINTS.NOTIFICATION_SETTINGS, specificAgentSettings)
        );
      } catch (err) {
        console.error(`处理客户端设置 ${agentId} 时出错:`, err);
      }
    }

    console.log(`总共 ${saveRequests.length} 个保存请求待处理`);
    
    // 并行执行所有保存请求
    const results = await Promise.all(saveRequests);
    console.log(`请求执行完成，结果数量: ${results.length}`);
    
    // 检查是否有任何请求失败
    const failedRequests = results.filter(response => !response.data?.success);
    
    if (failedRequests.length > 0) {
      console.error(`有 ${failedRequests.length} 个请求失败:`);
      failedRequests.forEach((response, index) => {
        console.error(`失败请求 ${index + 1}:`, response.data?.message || '未知错误');
      });
      
      return {
        success: false,
        message: '部分通知设置保存失败'
      };
    }
    
    console.log('所有通知设置保存成功');
    return {
      success: true,
      message: '通知设置保存成功'
    };
  } catch (error) {
    console.error('保存通知设置失败', error);
    return {
      success: false,
      message: '保存通知设置失败'
    };
  }
};

// 创建通知渠道
export const createNotificationChannel = async (channelData: any) => {
  try {
    const response = await axios.post(API_ENDPOINTS.NOTIFICATION_CHANNELS, channelData);
    return response.data;
  } catch (error) {
    console.error('创建通知渠道失败', error);
    return {
      success: false,
      message: '创建通知渠道失败'
    };
  }
};

// 更新通知渠道
export const updateNotificationChannel = async (channelId: string, channelData: any) => {
  try {
    const response = await axios.put(API_ENDPOINTS.NOTIFICATION_CHANNEL_DETAIL(Number(channelId)), channelData);
    return response.data;
  } catch (error) {
    console.error('更新通知渠道失败', error);
    return {
      success: false,
      message: '更新通知渠道失败'
    };
  }
};

// 删除通知渠道
export const deleteNotificationChannel = async (channelId: string) => {
  try {
    const response = await axios.delete(API_ENDPOINTS.NOTIFICATION_CHANNEL_DETAIL(Number(channelId)));
    return response.data;
  } catch (error) {
    console.error('删除通知渠道失败', error);
    return {
      success: false,
      message: '删除通知渠道失败'
    };
  }
}; 