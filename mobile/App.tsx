import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 导入配置
import initI18n from './src/i18n/i18n';
import AppNavigator from './src/navigation';
import { loadApiBaseUrl } from './src/config/api';

// 应用状态标志
export const APP_STATE = {
  API_URL_CONFIGURED: 'api_url_configured'
};

export default function App() {
  const [i18n, setI18n] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [apiUrlConfigured, setApiUrlConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const prepare = async () => {
      try {
        // 初始化i18n
        const i18nInstance = await initI18n();
        setI18n(i18nInstance);
        
        // 加载API基础URL
        const storedApiUrl = await AsyncStorage.getItem('api_base_url');
        await loadApiBaseUrl();
        
        // 检查API URL是否已配置
        const apiConfigured = storedApiUrl !== null;
        setApiUrlConfigured(apiConfigured);
        
        // 保存API URL配置状态
        await AsyncStorage.setItem(APP_STATE.API_URL_CONFIGURED, String(apiConfigured));
        console.log('API基础URL检查：', apiConfigured ? '已配置' : '未配置');
        
        // 可以在这里添加其他初始化任务，如加载字体等
        
        // 完成准备
        setIsReady(true);
      } catch (e) {
        console.warn('应用初始化失败:', e);
        // 即使出错也设置为就绪，以便显示错误信息
        setIsReady(true); 
      }
    };

    prepare();
  }, []);

  if (!isReady || !i18n) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
        <AppNavigator initialApiConfigured={apiUrlConfigured} />
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  }
});
