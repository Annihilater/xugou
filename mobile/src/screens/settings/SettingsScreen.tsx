import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Button
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAuthStore } from '../../store/authStore';
import { navigateAndReset } from '../../navigation/navigationUtils';

// 引入语言切换函数
import { changeLanguage } from '../../i18n/i18n';

// 引入认证服务
import authService from '../../api/auth';

// 引入app.json获取版本号
import appJson from '../../../app.json';

// 浏览器环境专用直接退出函数
const browserDirectLogout = () => {
  console.log('执行浏览器环境专用退出函数');
  
  try {
    // @ts-ignore
    if (typeof window !== 'undefined') {
      console.log('browserDirectLogout: 检测到浏览器环境');
      
      // 清除认证状态
      const authStore = useAuthStore.getState();
      authStore.setAuthenticated(false);
      authStore.setUser(null);
      console.log('browserDirectLogout: 认证状态已重置');
      
      // 清除localStorage
      try {
        // @ts-ignore
        if (window.localStorage) {
          // @ts-ignore
          window.localStorage.removeItem('auth_token');
          // @ts-ignore
          window.localStorage.removeItem('user');
          console.log('browserDirectLogout: localStorage已清除');
        }
      } catch (e) {
        console.error('browserDirectLogout: 清除localStorage失败', e);
      }
      
      // 清除AsyncStorage (可能不适用于浏览器，但为安全起见)
      try {
        AsyncStorage.removeItem('auth_token');
        AsyncStorage.removeItem('user');
        console.log('browserDirectLogout: AsyncStorage已清除');
      } catch (e) {
        console.error('browserDirectLogout: 清除AsyncStorage失败', e);
      }
      
      // 立即重定向到登录页
      console.log('browserDirectLogout: 立即重定向到登录页');
      // @ts-ignore
      window.location.href = '/login';
      
      return true;
    }
  } catch (e) {
    console.error('browserDirectLogout: 浏览器环境退出失败', e);
  }
  
  return false;
};

// 应用设置类型
interface AppSettings {
  language: string;
  notifications: {
    monitorAlerts: boolean;
    agentAlerts: boolean;
  };
}

// 默认设置
const defaultSettings: AppSettings = {
  language: 'zh',
  notifications: {
    monitorAlerts: true,
    agentAlerts: true
  }
};

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [userEmail, setUserEmail] = useState<string>('');
  const [appVersion, setAppVersion] = useState<string>('');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  
  // 加载设置
  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('app_settings');
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
      
      // 获取当前用户信息
      const user = await authService.getUserFromStorage();
      if (user && user.email) {
        setUserEmail(user.email);
      }
      
      // 获取应用版本
      if (appJson && appJson.expo) {
        setAppVersion(appJson.expo.version || '1.0.0');
      }
    } catch (error) {
      console.error('加载设置失败', error);
    }
  };
  
  // 保存设置
  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('保存设置失败', error);
      Alert.alert(t('common.error', '错误'), t('settings.saveFailed', '保存设置失败'));
    }
  };
  
  // 切换语言
  const handleLanguageChange = async (language: string) => {
    try {
      await changeLanguage(language);
      const newSettings = { ...settings, language };
      saveSettings(newSettings);
      setLanguageModalVisible(false);
    } catch (error) {
      console.error('切换语言失败', error);
      Alert.alert(t('common.error', '错误'), t('settings.languageChangeFailed', '切换语言失败'));
    }
  };
  
  // 打开监控告警设置页面
  const handleOpenMonitorNotifications = () => {
    navigation.navigate('MonitorNotifications');
  };
  
  // 打开客户端告警设置页面
  const handleOpenAgentNotifications = () => {
    navigation.navigate('AgentNotifications');
  };
  
  // 退出登录
  const handleLogout = () => {
    console.log('退出按钮处理函数被调用');
    
    // 先尝试浏览器环境的直接退出
    if (browserDirectLogout()) {
      console.log('浏览器环境直接退出成功，无需进一步操作');
      return;
    }
    
    // 非浏览器环境使用标准确认退出流程
    Alert.alert(
      t('auth.logoutTitle', '退出登录'),
      t('auth.logoutConfirmation', '您确定要退出登录吗？'),
      [
        {
          text: t('common.cancel', '取消'),
          style: 'cancel',
          onPress: () => console.log('用户取消退出登录')
        },
        {
          text: t('auth.logout', '退出登录'),
          style: 'destructive',
          onPress: () => {
            console.log('用户确认退出，执行退出逻辑');
            
            // 1. 直接设置认证状态为未认证
            console.log('1. 直接设置认证状态为未认证');
            const authStore = useAuthStore.getState();
            authStore.setAuthenticated(false);
            authStore.setUser(null);
            
            // 2. 清除AsyncStorage中的认证数据
            console.log('2. 清除AsyncStorage中的认证数据');
            Promise.all([
              AsyncStorage.removeItem('auth_token'),
              AsyncStorage.removeItem('user')
            ]).then(() => {
              console.log('所有存储数据已清除');
            }).catch(e => {
              console.error('清除存储数据时出错', e);
            });
            
            // 3. 使用多种方式尝试导航
            console.log('3. 多种方式尝试导航');
            
            // 方式1: 使用navigation对象
            try {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
              console.log('方式1导航成功');
            } catch (e) {
              console.error('方式1导航失败', e);
              
              // 方式2: 使用全局navigateAndReset函数
              try {
                navigateAndReset('Login');
                console.log('方式2导航成功');
              } catch (e2) {
                console.error('方式2导航失败', e2);
              }
            }
          }
        }
      ]
    );
  };
  
  // 打开语言选择器
  const handleOpenLanguageSelector = () => {
    setLanguageModalVisible(true);
  };
  
  // 组件挂载时加载设置
  useEffect(() => {
    loadSettings();
  }, []);
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 账户部分 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account', '账户')}</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.menuItemContent}>
              <Ionicons name="person-outline" size={22} color="#0066cc" />
              <Text style={styles.menuItemText}>{t('settings.profile', '个人资料')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
        
        {/* 语言设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language', '语言')}</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleOpenLanguageSelector}
          >
            <View style={styles.menuItemContent}>
              <Ionicons name="language" size={22} color="#0066cc" />
              <Text style={styles.menuItemText}>{t('settings.language', '语言')}</Text>
            </View>
            <View style={styles.menuItemValueContainer}>
              <Text style={styles.menuItemValue}>
                {settings.language === 'zh' ? '中文' : 'English'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* 语言选择器弹出框 */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={languageModalVisible}
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('settings.selectLanguage', '选择语言')}</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setLanguageModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.languageOptions}>
                <TouchableOpacity 
                  style={[styles.languageOption, settings.language === 'zh' && styles.selectedLanguageOption]}
                  onPress={() => handleLanguageChange('zh')}
                >
                  <Text style={styles.languageOptionText}>中文</Text>
                  {settings.language === 'zh' && (
                    <Ionicons name="checkmark" size={22} color="#0066cc" />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.languageOption, settings.language === 'en' && styles.selectedLanguageOption]}
                  onPress={() => handleLanguageChange('en')}
                >
                  <Text style={styles.languageOptionText}>English</Text>
                  {settings.language === 'en' && (
                    <Ionicons name="checkmark" size={22} color="#0066cc" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* 告警通知设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.notifications', '告警通知设置')}</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('GlobalSettings')}
          >
            <View style={styles.menuItemContent}>
              <Ionicons name="settings-outline" size={22} color="#0066cc" />
              <Text style={styles.menuItemText}>{t('settings.globalSettings', '全局设置')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('NotificationChannels')}
          >
            <View style={styles.menuItemContent}>
              <Ionicons name="notifications-outline" size={22} color="#0066cc" />
              <Text style={styles.menuItemText}>{t('settings.notificationChannels', '通知渠道')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleOpenMonitorNotifications}
          >
            <View style={styles.menuItemContent}>
              <Ionicons name="globe-outline" size={22} color="#0066cc" />
              <Text style={styles.menuItemText}>{t('settings.notificationsMonitor', '监控告警通知')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleOpenAgentNotifications}
          >
            <View style={styles.menuItemContent}>
              <Ionicons name="hardware-chip-outline" size={22} color="#0066cc" />
              <Text style={styles.menuItemText}>{t('settings.notificationsAgent', '客户端告警通知')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
        
        {/* 关于 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about', '关于')}</Text>
          <View style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Ionicons name="information-circle-outline" size={22} color="#0066cc" />
              <Text style={styles.menuItemText}>{t('settings.version', '版本')}</Text>
            </View>
            <Text style={styles.menuItemValue}>{appVersion}</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>XUGOU 监控 © 2025</Text>
        </View>
        
        {/* 额外的间隔区域 */}
        <View style={styles.spacer} />
        
        {/* 退出登录按钮 */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => {
              console.log('退出按钮被点击 - 直接事件回调');
              // 执行退出逻辑
              handleLogout();
            }}
            activeOpacity={0.5}
            testID="logoutButton"
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
            <Text style={styles.logoutButtonText}>{t('auth.logout', '退出登录')}</Text>
          </TouchableOpacity>
          <Text style={styles.logoutDescription}>{t('auth.logoutDescription', '退出当前账户并返回登录界面')}</Text>
        </View>
        
        {/* 底部安全区域，确保内容不被导航栏遮挡 */}
        <View style={styles.safeArea} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedMenuItem: {
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  menuItemValue: {
    fontSize: 14,
    color: '#888',
  },
  menuItemValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageCode: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066cc',
    width: 22,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
  },
  logoutContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    marginTop: 0,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f76363',
    borderRadius: 12,
    paddingVertical: 20,
    marginHorizontal: 0,
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  logoutDescription: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  languageOptions: {
    marginTop: 10,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedLanguageOption: {
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
  },
  languageOptionText: {
    fontSize: 16,
  },
  spacer: {
    height: 40,
  },
  safeArea: {
    height: 200,
  },
});

export default SettingsScreen; 