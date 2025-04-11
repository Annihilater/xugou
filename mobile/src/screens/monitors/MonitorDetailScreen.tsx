import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import monitorService from '../../api/monitors';
// 移除 react-native-chart-kit 依赖，使用自定义简单图表

// 简单的自定义图表组件
const SimpleLineChart: React.FC<{
  data: number[];
  labels: string[];
  color: string;
  width: number;
  height: number;
}> = ({ data, labels, color, width, height }) => {
  // 找到数据的最大值和最小值，用于缩放
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1; // 避免除以零

  return (
    <View style={{ width, height, marginVertical: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: height - 20 }}>
        {data.map((value, index) => {
          // 计算条形高度
          const barHeight = ((value - minValue) / range) * (height - 40);
          
          return (
            <View 
              key={index} 
              style={{ 
                alignItems: 'center',
                justifyContent: 'flex-end',
                width: (width / data.length) - 4
              }}
            >
              <View 
                style={{
                  backgroundColor: color,
                  width: 8,
                  height: Math.max(barHeight, 4),
                  borderRadius: 4
                }}
              />
              {index % 4 === 0 && (
                <Text style={{ fontSize: 10, marginTop: 4 }}>
                  {labels[index]}
                </Text>
              )}
            </View>
          );
        })}
      </View>
      <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
        <Text style={{ fontSize: 10, color: '#888' }}>
          {minValue}-{maxValue} ms
        </Text>
      </View>
    </View>
  );
};

// 监控类型定义
interface Monitor {
  id: string;
  name: string;
  url: string;
  type: string;
  method: string;
  interval: number;
  timeout: number;
  status: string;
  active: boolean;
  uptime: number;
  response_time: number;
  last_check?: string;
  last_checked?: string;
  created_at: string;
}

// 历史记录类型
interface MonitorStatusHistory {
  id: string;
  status: string;
  timestamp: string;
  response_time?: number;
}

// 路由参数类型
type MonitorDetailRouteProp = RouteProp<{ MonitorDetail: { monitorId: string } }, 'MonitorDetail'>;

const MonitorDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<MonitorDetailRouteProp>();
  const { monitorId } = route.params;
  
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [history, setHistory] = useState<MonitorStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingNow, setCheckingNow] = useState(false);
  
  const screenWidth = Dimensions.get('window').width - 32;
  
  // 加载监控详情和历史
  const fetchData = async () => {
    try {
      // 获取监控详情
      const monitorResult = await monitorService.getMonitorById(monitorId);
      if (!monitorResult.success || !monitorResult.monitor) {
        throw new Error(monitorResult.message || '获取监控详情失败');
      }
      
      // 获取监控历史
      const historyData = await monitorService.getMonitorHistory(Number(monitorId));
      
      // 转换历史数据格式以兼容界面显示
      const formattedHistory: MonitorStatusHistory[] = historyData.map((item: any) => ({
        id: String(item.id || `hist-${monitorId}-${Math.random()}`),
        status: item.status,
        timestamp: item.timestamp,
        response_time: item.response_time
      }));
      
      // 对历史记录按时间戳倒序排列
      const sortedHistory = formattedHistory.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setMonitor(monitorResult.monitor);
      setHistory(sortedHistory);
    } catch (error) {
      console.error('获取监控详情失败', error);
      Alert.alert(t('common.error', '错误'), t('monitors.fetchDetailFailed', '获取监控详情失败'));
    } finally {
      setLoading(false);
    }
  };
  
  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };
  
  // 立即检查
  const handleCheckNow = async () => {
    setCheckingNow(true);
    try {
      await monitorService.checkMonitor(Number(monitorId));
      await fetchData();
      Alert.alert(t('monitors.checkNowSuccess', '检查成功'), t('monitors.checkNowSuccessMessage', '已成功发起检查，请稍后刷新查看结果'));
    } catch (error) {
      console.error('立即检查失败', error);
      Alert.alert(t('common.error', '错误'), t('monitors.checkNowFailed', '立即检查失败'));
    } finally {
      setCheckingNow(false);
    }
  };
  
  // 编辑监控
  const handleEdit = () => {
    navigation.navigate('EditMonitor', { monitorId });
  };
  
  // 删除监控
  const handleDelete = () => {
    Alert.alert(
      t('monitors.deleteConfirmTitle', '确认删除'),
      t('monitors.deleteConfirmMessage', '确定要删除此监控项？此操作不可恢复。'),
      [
        {
          text: t('common.cancel', '取消'),
          style: 'cancel'
        },
        {
          text: t('common.delete', '删除'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await monitorService.deleteMonitor(monitorId);
              if (result.success) {
                navigation.goBack();
              } else {
                Alert.alert(t('common.error', '错误'), result.message || t('monitors.deleteFailed', '删除监控失败'));
              }
            } catch (error) {
              console.error('删除监控失败', error);
              Alert.alert(t('common.error', '错误'), t('monitors.deleteFailed', '删除监控失败'));
            }
          }
        }
      ]
    );
  };
  
  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
        return '#30c85e';
      case 'down':
        return '#f76363';
      case 'pending':
        return '#f4ca64';
      default:
        return '#aaaaaa';
    }
  };
  
  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'up':
        return t('monitors.statusDetails.up', '正常');
      case 'down':
        return t('monitors.statusDetails.down', '故障');
      case 'pending':
        return t('monitors.statusDetails.pending', '待检');
      default:
        return t('monitors.statusDetails.unknown', '未知');
    }
  };
  
  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return t('common.unknown', '未知');
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // 格式化时长
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}${t('common.time.minutes', '分钟')}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours}${t('common.time.hours', '小时')}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days}${t('common.time.days', '天')}`;
    }
  };
  
  // 组件挂载时加载数据
  useEffect(() => {
    fetchData();
  }, [monitorId]);
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }
  
  if (!monitor) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#f76363" />
        <Text style={styles.errorText}>
          {t('monitors.monitorNotFound', '找不到监控信息')}
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>{t('common.goBack', '返回')}</Text>
        </TouchableOpacity>
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
      {/* 头部信息 */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(monitor.status) }]} />
          <Text style={styles.title}>{monitor.name}</Text>
        </View>
        <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(monitor.status) }]}>
          {getStatusText(monitor.status)}
        </Text>
      </View>
      
      {/* 基本信息卡片 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('monitors.basicInfo', '基本信息')}</Text>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{t('monitors.url', 'URL')}:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{monitor.url}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{t('monitors.type', '类型')}:</Text>
          <Text style={styles.detailValue}>{monitor.type?.toUpperCase() || 'HTTP'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{t('monitors.method', '方法')}:</Text>
          <Text style={styles.detailValue}>{monitor.method}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{t('monitors.interval', '检查间隔')}:</Text>
          <Text style={styles.detailValue}>{formatDuration(monitor.interval)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{t('monitors.timeout', '超时')}:</Text>
          <Text style={styles.detailValue}>{monitor.timeout}s</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{t('monitors.created', '创建时间')}:</Text>
          <Text style={styles.detailValue}>{formatDate(monitor.created_at)}</Text>
        </View>
      </View>
      
      {/* 状态卡片 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('monitors.statusDetails.title', '当前状态')}</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>{t('monitors.statusDetails.lastCheck', '最后检查')}</Text>
            <Text style={styles.statusValue}>{formatDate(monitor.last_check || monitor.last_checked)}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>{t('monitors.statusDetails.uptime', '在线率')}</Text>
            <Text style={styles.statusValue}>{monitor.uptime.toFixed(2)}%</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>{t('monitors.statusDetails.responseTime', '响应时间')}</Text>
            <Text style={styles.statusValue}>{monitor.response_time}ms</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>{t('monitors.statusDetails.active', '活动状态')}</Text>
            <Text style={[
              styles.statusValue, 
              { color: monitor.active ? '#30c85e' : '#f76363' }
            ]}>
              {monitor.active 
                ? t('monitors.statusDetails.activeState', '活跃') 
                : t('monitors.statusDetails.pausedState', '已暂停')}
            </Text>
          </View>
        </View>
      </View>
      
      {/* 响应时间图表 */}
      {history.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('monitors.charts.responseTime', '响应时间趋势')}</Text>
          <SimpleLineChart
            data={history.slice(-12).map(item => item.response_time || 0)}
            labels={history.slice(-12).map(item => {
              const date = new Date(item.timestamp);
              return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            })}
            color="#0066cc"
            width={screenWidth}
            height={220}
          />
        </View>
      )}
      
      {/* 历史记录 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('monitors.historyRecords.title', '历史记录')}</Text>
        <View style={styles.historyList}>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>{t('monitors.historyRecords.empty', '暂无历史记录')}</Text>
          ) : (
            history.slice(0, 5).map((item, index) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={[styles.historyStatus, { backgroundColor: getStatusColor(item.status) }]} />
                <View style={styles.historyContent}>
                  <Text style={styles.historyTime}>{formatDate(item.timestamp)}</Text>
                  <Text style={styles.historyDetail}>
                    {getStatusText(item.status)}
                    {item.response_time && ` - ${item.response_time}ms`}
                  </Text>
                </View>
              </View>
            ))
          )}
          
          {history.length > 5 && (
            <TouchableOpacity 
              style={styles.viewMoreButton}
              onPress={() => navigation.navigate('MonitorHistory', { monitorId })}
            >
              <Text style={styles.viewMoreText}>
                {t('monitors.historyRecords.viewMore', '查看更多历史')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* 操作按钮 */}
      <View style={styles.actionsCard}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleCheckNow}
          disabled={checkingNow}
        >
          {checkingNow ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>
                {t('monitors.actions.checkNow', '立即检查')}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>
            {t('common.delete', '删除')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 90,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusItem: {
    width: '50%',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  historyList: {
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyStatus: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    marginTop: 5,
  },
  historyContent: {
    flex: 1,
  },
  historyTime: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  historyDetail: {
    fontSize: 14,
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  viewMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  viewMoreText: {
    fontSize: 14,
    color: '#0066cc',
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 20,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'white',
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: '#0066cc',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  secondaryButtonText: {
    color: '#0066cc',
  },
  successButton: {
    backgroundColor: '#30c85e',
  },
  warningButton: {
    backgroundColor: '#f4ca64',
  },
  dangerButton: {
    backgroundColor: '#f76363',
  },
});

export default MonitorDetailScreen; 