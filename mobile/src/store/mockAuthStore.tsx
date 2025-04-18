import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthStore = {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuthenticated: () => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  user: null,
  token: null,

  // 登录函数
  login: async (email, password) => {
    try {
      // 模拟API登录请求成功
      const mockUser = {
        id: '1',
        email,
        name: '测试用户',
        role: 'admin'
      };
      const mockToken = 'mock_jwt_token';

      // 存储到状态和本地存储
      set({ isAuthenticated: true, user: mockUser, token: mockToken });
      await AsyncStorage.setItem('auth_token', mockToken);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      
      return true;
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  },

  // 退出登录
  logout: async () => {
    try {
      // 清除状态和本地存储
      set({ isAuthenticated: false, user: null, token: null });
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('退出失败:', error);
    }
  },

  // 检查认证状态
  checkAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userJson = await AsyncStorage.getItem('user');
      
      if (token && userJson) {
        const user = JSON.parse(userJson);
        set({ isAuthenticated: true, user, token });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('检查认证状态失败:', error);
      return false;
    }
  }
})); 