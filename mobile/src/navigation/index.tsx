import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { navigationRef } from './navigationUtils';
import ApiUrlSettings from '../components/ApiUrlSettings';

// Screens - 只引用已实现的屏幕
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import MonitorsScreen from '../screens/monitors/MonitorsScreen';
import MonitorDetailScreen from '../screens/monitors/MonitorDetailScreen';
import CreateMonitorScreen from '../screens/monitors/CreateMonitorScreen';
import AgentsScreen from '../screens/agents/AgentsScreen';
import AgentDetailScreen from '../screens/agents/AgentDetailScreen';
import CreateAgentScreen from '../screens/agents/CreateAgentScreen';
import StatusScreen from '../screens/status/StatusScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';
import MonitorNotificationsScreen from '../screens/settings/MonitorNotificationsScreen';
import AgentNotificationsScreen from '../screens/settings/AgentNotificationsScreen';
import GlobalSettingsScreen from '../screens/settings/GlobalSettingsScreen';
import NotificationChannelsScreen from '../screens/settings/NotificationChannelsScreen';
import LoginScreen from '../screens/auth/LoginScreen';

// Auth context
import { useAuthStore } from '../store/authStore';

// 监控导航栈
const MonitorsStack = createNativeStackNavigator();
const MonitorsNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <MonitorsStack.Navigator>
      <MonitorsStack.Screen
        name="MonitorsList"
        component={MonitorsScreen}
        options={{ title: t('navigation.monitors', '监控') }}
      />
      <MonitorsStack.Screen
        name="MonitorDetail"
        component={MonitorDetailScreen}
        options={({ route }: any) => ({ 
          title: route.params?.name || t('monitors.detail', '监控详情') 
        })}
      />
      <MonitorsStack.Screen
        name="CreateMonitor"
        component={CreateMonitorScreen}
        options={{ title: t('monitors.addMonitor', '添加监控') }}
      />
    </MonitorsStack.Navigator>
  );
};

// 客户端导航栈
const AgentsStack = createNativeStackNavigator();
const AgentsNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <AgentsStack.Navigator>
      <AgentsStack.Screen
        name="AgentsList"
        component={AgentsScreen}
        options={{ title: t('navigation.agents', '客户端') }}
      />
      <AgentsStack.Screen
        name="AgentDetail"
        component={AgentDetailScreen}
        options={({ route }: any) => ({ 
          title: route.params?.name || t('agents.detail', '客户端详情') 
        })}
      />
      <AgentsStack.Screen
        name="CreateAgent"
        component={CreateAgentScreen}
        options={{ title: t('agents.addAgent', '添加客户端') }}
      />
    </AgentsStack.Navigator>
  );
};

// 主页标签栏
const MainTab = createBottomTabNavigator();
const MainTabNavigator = () => {
  const { t } = useTranslation();
  
  const tabBarStyle = {
    height: 60,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  };
  
  return (
    <MainTab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarShowLabel: true,
        headerShown: true,
        tabBarStyle: tabBarStyle,
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarIconStyle: {
          marginTop: 5
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginBottom: 5
        }
      }}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: t('navigation.dashboard', '仪表盘'),
          tabBarLabel: t('navigation.dashboard', '仪表盘'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={22} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Monitors"
        component={MonitorsNavigator}
        options={{
          title: t('navigation.monitors', '监控'),
          tabBarLabel: t('navigation.monitors', '监控'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={22} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Agents"
        component={AgentsNavigator}
        options={{
          title: t('navigation.agents', '客户端'),
          tabBarLabel: t('navigation.agents', '客户端'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hardware-chip-outline" size={22} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('navigation.settings', '设置'),
          tabBarLabel: t('navigation.settings', '设置'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={22} color={color} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
};

// 根导航
const RootStack = createNativeStackNavigator();
const RootNavigator = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const { isAuthenticated, checkAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const prevAuthState = React.useRef(false);
  
  // 初始检查认证状态
  React.useEffect(() => {
    const checkAuth = async () => {
      await checkAuthenticated();
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  // 监听认证状态变化
  React.useEffect(() => {
    // 如果状态从认证变为未认证
    if (prevAuthState.current && !isAuthenticated && !isLoading) {
      console.log('认证状态从true变为false，手动处理导航');
      
      setTimeout(() => {
        if (navigationRef.isReady()) {
          try {
            navigationRef.reset({
              index: 0,
              routes: [{ name: 'Login' }]
            });
            console.log('导航手动重置成功');
          } catch (e) {
            console.error('导航手动重置失败', e);
          }
        } else {
          console.log('导航容器未就绪，无法执行手动重置');
        }
      }, 300);
    }
    
    // 记录当前状态，用于下次比较
    prevAuthState.current = isAuthenticated;
  }, [isAuthenticated, isLoading]);
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <RootStack.Screen name="Main" component={MainTabNavigator} />
          <RootStack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              headerShown: false
            }}
          />
          <RootStack.Screen 
            name="Status" 
            component={StatusScreen}
            options={{
              headerShown: false
            }}
          />
          <RootStack.Screen 
            name="GlobalSettings" 
            component={GlobalSettingsScreen}
            options={{
              headerShown: false
            }}
          />
          <RootStack.Screen 
            name="NotificationChannels" 
            component={NotificationChannelsScreen}
            options={{
              headerShown: false
            }}
          />
          <RootStack.Screen 
            name="MonitorNotifications" 
            component={MonitorNotificationsScreen}
            options={{
              headerShown: false
            }}
          />
          <RootStack.Screen 
            name="AgentNotifications" 
            component={AgentNotificationsScreen}
            options={{
              headerShown: false
            }}
          />
        </>
      ) : (
        <>
          <RootStack.Screen name="Login" component={LoginScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
};

// 导航容器
const AppNavigator = ({ initialApiConfigured }: { initialApiConfigured: boolean | null }) => {
  const colorScheme = useColorScheme();
  const [apiUrlSettingsVisible, setApiUrlSettingsVisible] = React.useState(!initialApiConfigured);
  
  // 设置完成回调函数
  const handleApiSetupComplete = React.useCallback(() => {
    // 添加延迟以确保所有状态已正确保存
    setTimeout(() => {
      setApiUrlSettingsVisible(false);
    }, 300);
  }, []);
  
  // 使用 useMemo 优化渲染内容
  const navigationContent = React.useMemo(() => {
    if (apiUrlSettingsVisible) {
      return (
        <ApiUrlSettings 
          mode="fullscreen"
          onComplete={handleApiSetupComplete}
          saveConfigured={true}
        />
      );
    }
    return <RootNavigator />;
  }, [apiUrlSettingsVisible, handleApiSetupComplete]);
  
  return (
    <NavigationContainer ref={navigationRef}>
      <SafeAreaProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {navigationContent}
      </SafeAreaProvider>
    </NavigationContainer>
  );
};

export default AppNavigator; 