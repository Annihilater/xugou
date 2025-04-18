import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authService, { User, LoginParams, RegisterParams } from '../api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 登录、注册、登出等操作
  login: (credentials: LoginParams) => Promise<boolean>;
  register: (userData: RegisterParams) => Promise<boolean>;
  logout: () => Promise<boolean>;
  
  // 获取用户信息
  getCurrentUser: () => Promise<User | null>;
  checkAuthenticated: () => Promise<boolean>;
  
  // 设置状态
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  // 登录
  login: async (credentials: LoginParams) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authService.login(credentials);
      
      if (response.success && response.user) {
        set({
          user: response.user,
          isAuthenticated: true,
          error: null,
        });
        return true;
      } else {
        set({ error: response.message || '登录失败' });
        return false;
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '登录失败' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 注册
  register: async (userData: RegisterParams) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        return true;
      } else {
        set({ error: response.message || '注册失败' });
        return false;
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '注册失败' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 登出
  logout: async () => {
    set({ isLoading: true });
    
    try {
      // 调用服务清除token
      await authService.logout();
      
      // 更新状态
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      
      console.log('authStore.logout 完成：状态已重置');
      return true;
    } catch (error) {
      console.error('登出时发生错误', error);
      set({ isLoading: false });
      return false;
    }
  },
  
  // 获取当前用户
  getCurrentUser: async () => {
    set({ isLoading: true });
    
    try {
      const user = await authService.getCurrentUser();
      
      if (user) {
        set({
          user,
          isAuthenticated: true,
        });
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('获取用户信息失败', error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 检查认证状态
  checkAuthenticated: async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        // 从本地存储获取用户信息
        const user = await authService.getUserFromStorage();
        
        if (user) {
          set({
            user,
            isAuthenticated: true,
          });
          return true;
        }
        
        // 如果本地没有用户信息但有token，尝试从服务器获取
        const currentUser = await authService.getCurrentUser();
        
        if (currentUser) {
          set({
            user: currentUser,
            isAuthenticated: true,
          });
          return true;
        }
      }
      
      set({
        user: null,
        isAuthenticated: false,
      });
      return false;
    } catch (error) {
      console.error('检查认证状态失败', error);
      set({
        user: null,
        isAuthenticated: false,
      });
      return false;
    }
  },
  
  // 设置用户
  setUser: (user: User | null) => set({ user }),
  
  // 设置认证状态
  setAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),
  
  // 设置加载状态
  setLoading: (isLoading: boolean) => set({ isLoading }),
  
  // 设置错误
  setError: (error: string | null) => set({ error }),
})); 