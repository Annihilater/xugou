import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
  Linking
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// 引入服务和类型
import monitorService, { Monitor } from '../../api/monitors';
import agentService, { Agent } from '../../api/agents';
import statusService, { StatusPageConfig, StatusPageData } from '../../api/status';

const StatusScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  
  const [statusConfig, setStatusConfig] = useState<StatusPageConfig | null>(null);
  const [statusData, setStatusData] = useState<StatusPageData | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 获取状态页数据
  const fetchStatusData = async () => {
    try {
      const config = await statusService.getStatusConfig();
      const monitorsData = await monitorService.getMonitors();
      const agentsData = await agentService.getAgents();
      const statusPageData = await statusService.getStatusData();
      
      setStatusConfig(config);
      setStatusData(statusPageData);
      setMonitors(monitorsData);
      setAgents(agentsData);
    } catch (error) {
      console.error('获取状态页数据失败', error);
      Alert.alert(t('common.error', '错误'), t('status.fetchDataFailed', '获取状态页数据失败'));
    } finally {
      setLoading(false);
    }
  };
  
  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatusData();
    setRefreshing(false);
  };
  
  // 计算整体系统状态
  const calculateOverallStatus = () => {
    // 如果有任何监控器down，则系统状态为故障
    const hasDownMonitor = monitors.some(m => m.status === 'down' && m.active);
    
    if (hasDownMonitor) {
      return 'down';
    }
    
    // 如果所有监控器都正常，但有不活跃的客户端，则系统状态为部分故障
    const hasInactiveAgent = agents.some(a => a.status === 'offline' || a.status === 'unknown');
    
    if (hasInactiveAgent) {
      return 'partial';
    }
    
    // 否则系统状态为正常
    return 'up';
  };
  
  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
        return '#30c85e'; // 绿色
      case 'down':
        return '#f76363'; // 红色
      case 'partial':
        return '#ffb224'; // 黄色
      default:
        return '#888'; // 灰色
    }
  };
  
  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'up':
        return t('status.statusUp', '所有系统正常');
      case 'down':
        return t('status.statusDown', '系统故障');
      case 'partial':
        return t('status.statusPartial', '部分系统故障');
      default:
        return t('status.statusUnknown', '状态未知');
    }
  };
  
  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return t('common.unknown', '未知');
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // 分享状态页
  const handleShare = async () => {
    try {
      if (!statusData) return;
      
      await Share.share({
        title: t('status.shareTitle', '系统状态页'),
        message: `${t('status.shareMessage', '查看我们的系统状态页面')}: ${statusData.title}`,
        url: statusData.title,
      });
    } catch (error) {
      console.error('分享失败', error);
    }
  };
  
  // 配置状态页
  const handleConfigure = () => {
    navigation.navigate('StatusConfig');
  };
  
  // 访问公共状态页
  const handleVisitPublicPage = () => {
    if (statusData) {
      // 这里应该使用真实的公共URL
      Alert.alert('查看状态页', `这里应该打开状态页：${statusData.title}`);
    }
  };
  
  // 组件挂载时加载数据
  useEffect(() => {
    fetchStatusData();
  }, []);
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }
  
  const overallStatus = calculateOverallStatus();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('navigation.status', '系统状态')}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleConfigure}
          >
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 状态页信息 */}
        {statusData && (
          <View style={styles.statusInfoCard}>
            <Text style={styles.statusPageTitle}>{statusData.title}</Text>
            <Text style={styles.statusPageDescription}>{statusData.description}</Text>
            
            <TouchableOpacity 
              style={styles.publicUrlButton}
              onPress={handleVisitPublicPage}
            >
              <Ionicons name="globe-outline" size={16} color="#0066cc" />
              <Text style={styles.publicUrlText}>{statusData.title}</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* 整体状态 */}
        <View style={[styles.card, { borderLeftColor: getStatusColor(overallStatus), borderLeftWidth: 4 }]}>
          <Text style={styles.cardTitle}>{t('status.overall', '整体状态')}</Text>
          <View style={styles.overallStatusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(overallStatus) }]} />
            <Text style={styles.overallStatusText}>
              {getStatusText(overallStatus)}
            </Text>
            <Text style={styles.lastUpdatedText}>
              {t('status.lastUpdated', '最后更新')}: {formatDate(new Date().toISOString())}
            </Text>
          </View>
        </View>
        
        {/* 监控状态 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('status.services', '服务状态')}</Text>
            <Text style={styles.serviceCount}>
              {monitors.filter(m => m.status === 'up').length}/{monitors.length} {t('status.operational', '正常')}
            </Text>
          </View>
          
          {monitors.length === 0 ? (
            <Text style={styles.emptyText}>{t('status.noServices', '没有可显示的服务')}</Text>
          ) : (
            <View style={styles.servicesList}>
              {monitors.map(monitor => (
                <View key={monitor.id} style={styles.serviceItem}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{monitor.name}</Text>
                    <Text style={styles.serviceUrl}>{monitor.url}</Text>
                  </View>
                  <View style={styles.serviceStatus}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(monitor.status) }]} />
                    <Text style={styles.serviceUptime}>{(monitor.uptime ?? 0).toFixed(1)}% {t('status.uptime', '在线率')}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* 服务器状态 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('status.servers', '服务器状态')}</Text>
            <Text style={styles.serviceCount}>
              {agents.filter(a => a.status === 'active').length}/{agents.length} {t('status.online', '在线')}
            </Text>
          </View>
          
          {agents.length === 0 ? (
            <Text style={styles.emptyText}>{t('status.noServers', '没有可显示的服务器')}</Text>
          ) : (
            <View style={styles.serversList}>
              {agents.map(agent => (
                <View key={agent.id} style={styles.serverItem}>
                  <View style={styles.serverInfo}>
                    <Text style={styles.serverName}>{agent.name}</Text>
                    <Text style={styles.serverHost}>{agent.hostname}</Text>
                  </View>
                  <View style={[
                    styles.serverStatusBadge, 
                    { 
                      backgroundColor: agent.status === 'active' 
                        ? 'rgba(48, 200, 94, 0.1)' 
                        : 'rgba(136, 136, 136, 0.1)',
                      borderColor: agent.status === 'active'
                        ? '#30c85e'
                        : '#888'
                    }
                  ]}>
                    <Text style={[
                      styles.serverStatusText,
                      { color: agent.status === 'active' ? '#30c85e' : '#888' }
                    ]}>
                      {agent.status === 'active' 
                        ? t('agents.status_active', '在线') 
                        : t('agents.status_inactive', '离线')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* 历史事件 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('status.history', '历史事件')}</Text>
          <TouchableOpacity style={styles.historyButton}>
            <Text style={styles.historyButtonText}>
              {t('status.viewIncidentHistory', '查看历史事件')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#0066cc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  statusInfoCard: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  statusPageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusPageDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  publicUrlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  publicUrlText: {
    fontSize: 14,
    color: '#0066cc',
    marginLeft: 8,
  },
  disabledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 99, 99, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  disabledText: {
    fontSize: 14,
    color: '#f76363',
    marginLeft: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  serviceCount: {
    fontSize: 14,
    color: '#666',
  },
  overallStatusContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  statusIndicator: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 16,
  },
  overallStatusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#888',
  },
  servicesList: {
    marginTop: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  serviceUrl: {
    fontSize: 12,
    color: '#888',
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  serviceUptime: {
    fontSize: 13,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#888',
  },
  serversList: {
    marginTop: 8,
  },
  serverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serverInfo: {
    flex: 1,
  },
  serverName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  serverHost: {
    fontSize: 12,
    color: '#888',
  },
  serverStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  serverStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  historyButtonText: {
    fontSize: 14,
    color: '#0066cc',
  },
  statusGroup: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
});

export default StatusScreen; 