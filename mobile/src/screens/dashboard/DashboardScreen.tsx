import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  RefreshControl, 
  ActivityIndicator, 
  StyleSheet, 
  View, 
  Text,
  TouchableOpacity
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

// 导入API服务
import monitorService, { Monitor } from '../../api/monitors';
import agentService, { Agent } from '../../api/agents';

const DashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      // 获取监控列表
      const monitorsData = await monitorService.getMonitors();
      setMonitors(monitorsData);
      
      // 获取客户端列表
      const agentsData = await agentService.getAgents();
      setAgents(agentsData);
    } catch (error) {
      console.error('获取仪表盘数据失败', error);
    } finally {
      setLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  // 计算统计信息
  const totalMonitors = monitors.length;
  const activeMonitors = monitors.filter(m => m.active !== undefined ? m.active : true).length;
  const downMonitors = monitors.filter(m => m.status === 'down').length;
  
  const totalAgents = agents.length;
  const onlineAgents = agents.filter(a => a.status === 'active' || a.status === 'online').length;
  const offlineAgents = agents.filter(a => a.status !== 'active' && a.status !== 'online').length;
  
  // 计算平均可用率，兼容可能缺少uptime属性的情况
  const avgUptime = monitors.length > 0
    ? monitors.reduce((acc, m) => acc + (m.uptime !== undefined ? m.uptime : 0), 0) / monitors.length
    : 0;
  
  // 计算平均响应时间，兼容可能缺少response_time属性的情况
  const avgResponseTime = monitors.length > 0
    ? Math.round(monitors.reduce((acc, m) => {
        const responseTime = m.response_time !== undefined ? m.response_time : 
                            (m.responseTime !== undefined ? m.responseTime : 0);
        return acc + responseTime;
      }, 0) / monitors.length)
    : 0;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
        return '#30c85e';
      case 'down':
        return '#f76363';
      case 'pending':
        return '#ffb224';
      default:
        return '#888';
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* 摘要卡片 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.summary', '数据摘要')}</Text>
          
          <View style={styles.separator} />
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalMonitors}</Text>
              <Text style={styles.statLabel}>{t('dashboard.totalMonitors', '总监控')}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activeMonitors}</Text>
              <Text style={styles.statLabel}>{t('dashboard.activeMonitors', '活跃监控')}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#f76363' }]}>{downMonitors}</Text>
              <Text style={styles.statLabel}>{t('dashboard.downMonitors', '故障监控')}</Text>
            </View>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalAgents}</Text>
              <Text style={styles.statLabel}>{t('dashboard.totalAgents', '总客户端')}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#30c85e' }]}>{onlineAgents}</Text>
              <Text style={styles.statLabel}>{t('dashboard.onlineAgents', '在线客户端')}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#ff9933' }]}>{offlineAgents}</Text>
              <Text style={styles.statLabel}>{t('dashboard.offlineAgents', '离线客户端')}</Text>
            </View>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{avgUptime.toFixed(2)}%</Text>
              <Text style={styles.statLabel}>{t('dashboard.uptime', '可用率')}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{avgResponseTime}ms</Text>
              <Text style={styles.statLabel}>{t('dashboard.responseTime', '响应时间')}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{new Date().toLocaleDateString()}</Text>
              <Text style={styles.statLabel}>{t('dashboard.date', '更新日期')}</Text>
            </View>
          </View>
        </View>
        
        {/* 监控状态 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('navigation.monitors', '监控')}</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Monitors')}
            >
              <Text style={styles.viewAllButtonText}>{t('common.viewAll', '查看全部')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.separator} />
          
          {monitors.length === 0 ? (
            <Text style={styles.notFound}>{t('common.notFound', '没有找到数据')}</Text>
          ) : (
            <View style={styles.itemList}>
              {monitors.slice(0, 5).map((monitor) => (
                <View key={monitor.id} style={styles.item}>
                  <Text style={styles.itemName}>{monitor.name}</Text>
                  <Text style={[styles.itemStatus, { color: getStatusColor(monitor.status) }]}>
                    {t(`monitors.status_${monitor.status}`, monitor.status === 'up' ? '正常' : '故障')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* 客户端状态 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('navigation.agents', '客户端')}</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Agents')}
            >
              <Text style={styles.viewAllButtonText}>{t('common.viewAll', '查看全部')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.separator} />
          
          {agents.length === 0 ? (
            <Text style={styles.notFound}>{t('common.notFound', '没有找到数据')}</Text>
          ) : (
            <View style={styles.itemList}>
              {agents.slice(0, 5).map((agent) => (
                <View key={agent.id} style={styles.item}>
                  <View>
                    <Text style={styles.itemName}>{agent.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      {agent.hostname || 'Unknown host'}
                    </Text>
                  </View>
                  <Text style={[
                    styles.itemStatus, 
                    { color: agent.status === 'active' ? '#30c85e' : '#888' }
                  ]}>
                    {t(`agents.status_${agent.status}`, agent.status === 'active' ? '在线' : '离线')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '30%',
    marginVertical: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  viewAllButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  viewAllButtonText: {
    fontSize: 12,
    color: '#0066cc',
  },
  notFound: {
    textAlign: 'center',
    color: '#888',
    padding: 16,
  },
  itemList: {
    marginTop: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  itemStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default DashboardScreen; 