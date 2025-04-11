import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// 导入语言文件
import enTranslation from './locales/en';
import zhTranslation from './locales/zh';

// 语言资源
const resources = {
  en: {
    translation: enTranslation,
  },
  zh: {
    translation: zhTranslation,
  },
};

// 初始化i18n
const initI18n = async () => {
  // 获取设备语言
  const deviceLanguage = Localization.locale.split('-')[0];
  
  // 从存储中获取用户选择的语言
  let storedLanguage = null;
  try {
    storedLanguage = await AsyncStorage.getItem('app_language');
  } catch (error) {
    console.error('获取语言设置失败', error);
  }
  
  // 配置i18n
  await i18n.use(initReactI18next).init({
    resources,
    lng: storedLanguage || deviceLanguage || 'zh', // 优先使用存储的语言，其次是设备语言，默认中文
    fallbackLng: 'zh', // 如果没有对应的翻译，回退到中文
    interpolation: {
      escapeValue: false, // 不需要转义
    },
  });
  
  return i18n;
};

// 更改语言
export const changeLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem('app_language', language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('更改语言失败', error);
  }
};

export default initI18n; 