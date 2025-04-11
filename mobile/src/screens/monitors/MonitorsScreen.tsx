import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import monitorService, { Monitor } from '../../api/monitors';

const MonitorsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [filteredMonitors, setFilteredMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all'); // all, up, down
  
  const fetchMonitors = async () => {
    try {
      setLoading(true);
      const data = await monitorService.getMonitors();
      setMonitors(data);
      applyFilter(data, filter);
    } catch (error) {
      console.error('获取监控列表失败', error);
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilter = (data: Monitor[], filterType: string) => {
    let result = [...data];
    
    switch (filterType) {
      case 'up':
        result = data.filter(m => m.status === 'up');
        break;
      case 'down':
        result = data.filter(m => m.status === 'down');
        break;
      default:
        break;
    }
    
    setFilteredMonitors(result);
  };
  
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    applyFilter(monitors, newFilter);
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonitors();
    setRefreshing(false);
  };
  
  useEffect(() => {
    fetchMonitors();
  }, []);
  
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
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'up':
        return t('monitors.statusDetails.up', '正常');
      case 'down':
        return t('monitors.statusDetails.down', '故障');
      case 'pending':
        return t('monitors.statusDetails.pending', '等待');
      default:
        return status;
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const renderMonitorItem = ({ item }: { item: Monitor }) => (
    <TouchableOpacity
      style={styles.monitorItem}
      onPress={() => navigation.navigate('MonitorDetail', { monitorId: item.id })}
    >
      <View style={styles.monitorHeader}>
        <Text style={styles.monitorName}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.monitorDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{t('monitors.url', 'URL')}:</Text>
          <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
            {item.url || '-'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('monitors.uptime', '正常率')}:</Text>
            <Text style={styles.detailValue}>{item.uptime}%</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('monitors.response_time', '响应时间')}:</Text>
            <Text style={styles.detailValue}>{item.response_time} ms</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('monitors.last_check', '最后检查')}:</Text>
            <Text style={styles.detailValue}>{formatDate(item.last_checked)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('monitors.method', '方法')}:</Text>
            <Text style={styles.detailValue}>{item.method || '-'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const keyExtractor = (item: Monitor) => item.id.toString();
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              {t('monitors.filters.all', '全部')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'up' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('up')}
          >
            <View style={[styles.statusIndicator, { backgroundColor: '#30c85e' }]} />
            <Text style={[styles.filterText, filter === 'up' && styles.filterTextActive]}>
              {t('monitors.statusDetails.up', '正常')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'down' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('down')}
          >
            <View style={[styles.statusIndicator, { backgroundColor: '#f76363' }]} />
            <Text style={[styles.filterText, filter === 'down' && styles.filterTextActive]}>
              {t('monitors.statusDetails.down', '故障')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateMonitor')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {filteredMonitors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>
            {t('monitors.noMonitorsFound', '没有找到监控项')}
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateMonitor')}
          >
            <Text style={styles.createButtonText}>
              {t('monitors.createFirst', '创建第一个监控')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredMonitors}
          renderItem={renderMonitorItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#e0f0ff',
  },
  filterText: {
    color: '#666',
  },
  filterTextActive: {
    color: '#0066cc',
    fontWeight: '500',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  listContainer: {
    padding: 16,
  },
  monitorItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  monitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monitorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#888',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  monitorDetails: {
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#0066cc',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MonitorsScreen; 