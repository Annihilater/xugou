import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, loadApiBaseUrl } from '../config/api';

// 开启详细日志输出用于调试
const enableDebugLogs = true;

// 创建一个Axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  async (config) => {
    // 从存储中获取最新的API_BASE_URL
    try {
      const baseUrl = await loadApiBaseUrl();
      config.baseURL = baseUrl;
    } catch (error) {
      console.error('获取API_BASE_URL失败', error);
      // 出错时使用默认值
      config.baseURL = API_BASE_URL;
    }
    
    // 调试日志
    if (enableDebugLogs) {
      const method = config.method?.toUpperCase() || 'UNKNOWN';
      const baseUrl = config.baseURL || '';
      const url = config.url || '';
      
      console.log(`🚀 发送${method}请求: ${baseUrl}${url}`);
      if (config.data) {
        console.log('📦 请求数据:', JSON.stringify(config.data).substring(0, 500));
      }
      if (config.params) {
        console.log('🔍 请求参数:', config.params);
      }
    }
    
    // 从存储中获取token
    const token = await AsyncStorage.getItem('auth_token');
    
    // 如果token存在，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ 请求发送失败:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 添加调试日志
    if (enableDebugLogs) {
      const method = response.config.method?.toUpperCase() || 'UNKNOWN';
      const url = response.config.url || 'unknown';
      console.log(`✅ ${method}请求成功: ${url}`);
      console.log(`📊 状态码: ${response.status}`);
      console.log('📦 响应数据:', JSON.stringify(response.data).substring(0, 500));
    }
    return response;
  },
  async (error) => {
    // 添加详细的错误日志
    if (enableDebugLogs) {
      console.error('❌ 请求失败:', error.message);
      
      if (error.response) {
        // 服务器返回了错误状态码
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        const url = error.config?.url || 'unknown';
        console.error(`🔥 ${method}请求错误: ${url}`);
        console.error(`📊 状态码: ${error.response.status}`);
        
        try {
          console.error('📦 错误响应:', JSON.stringify(error.response.data).substring(0, 500));
        } catch (e) {
          console.error('📦 错误响应(非JSON):', String(error.response.data).substring(0, 500));
        }
        
        // 处理401未授权错误
        if (error.response.status === 401 && !error.config._retry) {
          error.config._retry = true;
          
          try {
            // 在实际应用中，这里应该调用刷新token的接口
            // 由于当前后端没有刷新token的接口，这里简单处理为清除token并返回错误
            await AsyncStorage.removeItem('auth_token');
            console.warn('⚠️ 用户未授权，已清除token');
            
            // 重定向到登录页的逻辑会在组件中处理
            return Promise.reject(error);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
      } else if (error.request) {
        // 请求已发送但没有收到响应
        console.error('⏱️ 请求超时或无响应:', error.config?.url || 'unknown');
      } else {
        // 设置请求时发生错误
        console.error('🔧 请求配置错误:', error.message);
      }
    }
    
    return Promise.reject(error);
  }
);

// API方法
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config);
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config);
  },
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config);
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config);
  },
};

export default api; 