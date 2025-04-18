import api from './client';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 用户类型
export interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

// 登录参数类型
export interface LoginParams {
  username: string;
  password: string;
}

// 注册参数类型
export interface RegisterParams {
  username: string;
  password: string;
  email?: string;
}

// 登录响应类型
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

// 注册响应类型
export interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
}

// 用户信息响应类型
export interface UserResponse {
  success: boolean;
  user: User;
}

// 认证API服务
const authService = {
  // 用户登录
  login: async (params: LoginParams): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(API_ENDPOINTS.LOGIN, params);
    
    // 保存token到本地存储
    if (response.data.success && response.data.token) {
      await AsyncStorage.setItem('auth_token', response.data.token);
      // 保存用户信息
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },
  
  // 用户注册
  register: async (params: RegisterParams): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>(API_ENDPOINTS.REGISTER, params);
    return response.data;
  },
  
  // 获取当前用户信息
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await api.get<UserResponse>(API_ENDPOINTS.GET_CURRENT_USER);
      
      if (response.data.success) {
        // 更新本地存储的用户信息
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      }
      
      return null;
    } catch (error) {
      console.error('获取用户信息失败', error);
      return null;
    }
  },
  
  // 从本地存储获取用户信息
  getUserFromStorage: async (): Promise<User | null> => {
    try {
      const userString = await AsyncStorage.getItem('user');
      
      if (userString) {
        return JSON.parse(userString) as User;
      }
      
      return null;
    } catch (error) {
      console.error('从存储获取用户信息失败', error);
      return null;
    }
  },
  
  // 检查是否已认证
  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  },
  
  // 登出
  logout: async (): Promise<void> => {
    try {
      console.log('authService.logout: 开始清除认证信息');
      
      // 浏览器环境专用处理
      try {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.location) {
          console.log('authService.logout: 检测到浏览器环境，执行浏览器环境下的登出');
          
          // 清除localStorage
          // @ts-ignore
          if (window.localStorage) {
            // @ts-ignore
            window.localStorage.removeItem('auth_token');
            // @ts-ignore
            window.localStorage.removeItem('user');
            console.log('authService.logout: localStorage清除成功');
          }
          
          // 直接重定向到登录页面
          console.log('authService.logout: 正在重定向到登录页面');
          // @ts-ignore
          window.location.href = '/login';
          return; // 提前返回，不执行下面的AsyncStorage清除
        }
      } catch (browserError) {
        console.log('authService.logout: 非浏览器环境，继续执行标准流程');
      }
      
      // 移动端环境下的标准流程
      await AsyncStorage.removeItem('auth_token');
      const tokenAfterRemoval = await AsyncStorage.getItem('auth_token');
      console.log('authService.logout: token已移除', tokenAfterRemoval === null);
      
      await AsyncStorage.removeItem('user');
      const userAfterRemoval = await AsyncStorage.getItem('user');
      console.log('authService.logout: user已移除', userAfterRemoval === null);
      
      console.log('authService.logout: 所有认证信息已清除');
    } catch (error) {
      console.error('authService.logout: 清除认证信息时出错', error);
      throw error; // 确保错误被传递给调用者
    }
  },
};

export default authService; 