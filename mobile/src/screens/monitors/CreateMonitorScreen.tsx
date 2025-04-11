import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import monitorService from '../../api/monitors';

// 请求头键值对类型
interface Header {
  key: string;
  value: string;
}

// 状态码选项类型
interface StatusCodeOption {
  label: string;
  value: string;
}

const CreateMonitorScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD'>('GET');
  const [interval, setInterval] = useState('60');
  const [timeoutValue, setTimeoutValue] = useState('30');
  const [expectedStatus, setExpectedStatus] = useState('200');
  const [headers, setHeaders] = useState<Header[]>([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  
  // HTTP方法选项
  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'] as const;
  
  // 状态码选项，包括范围选择
  const statusCodeOptions: StatusCodeOption[] = [
    { label: `200 - ${t('monitors.statusCodes.ok', 'OK')}`, value: '200' },
    { label: `201 - ${t('monitors.statusCodes.created', 'Created')}`, value: '201' },
    { label: `204 - ${t('monitors.statusCodes.noContent', 'No Content')}`, value: '204' },
    { label: `2xx - ${t('monitors.statusCodes.successful', 'Successful')}`, value: '2xx' },
    { label: `301 - ${t('monitors.statusCodes.movedPermanently', 'Moved Permanently')}`, value: '301' },
    { label: `302 - ${t('monitors.statusCodes.found', 'Found')}`, value: '302' },
    { label: `3xx - ${t('monitors.statusCodes.redirection', 'Redirection')}`, value: '3xx' },
    { label: `400 - ${t('monitors.statusCodes.badRequest', 'Bad Request')}`, value: '400' },
    { label: `401 - ${t('monitors.statusCodes.unauthorized', 'Unauthorized')}`, value: '401' },
    { label: `403 - ${t('monitors.statusCodes.forbidden', 'Forbidden')}`, value: '403' },
    { label: `404 - ${t('monitors.statusCodes.notFound', 'Not Found')}`, value: '404' },
    { label: `4xx - ${t('monitors.statusCodes.clientError', 'Client Error')}`, value: '4xx' },
    { label: `500 - ${t('monitors.statusCodes.serverError', 'Internal Server Error')}`, value: '500' },
    { label: `502 - ${t('monitors.statusCodes.badGateway', 'Bad Gateway')}`, value: '502' },
    { label: `503 - ${t('monitors.statusCodes.serviceUnavailable', 'Service Unavailable')}`, value: '503' },
    { label: `504 - ${t('monitors.statusCodes.gatewayTimeout', 'Gateway Timeout')}`, value: '504' },
    { label: `5xx - ${t('monitors.statusCodes.serverErrors', 'Server Error')}`, value: '5xx' },
  ];
  
  // 将请求头键值对转换为JSON对象
  const headersToJson = () => {
    const result: Record<string, string> = {};
    
    headers.forEach(({ key, value }) => {
      if (key.trim()) {
        result[key.trim()] = value;
      }
    });
    
    return result;
  };
  
  // 添加新的请求头行
  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };
  
  // 删除请求头行
  const removeHeader = (index: number) => {
    if (headers.length > 1) {
      const newHeaders = [...headers];
      newHeaders.splice(index, 1);
      setHeaders(newHeaders);
    }
  };
  
  // 更新请求头键值对
  const updateHeader = (index: number, field: keyof Header, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    
    // 如果最后一行有输入内容，自动添加新行
    if (index === headers.length - 1 && (newHeaders[index].key || newHeaders[index].value)) {
      newHeaders.push({ key: '', value: '' });
    }
    
    setHeaders(newHeaders);
  };
  
  // 获取当前选择的状态码标签
  const getSelectedStatusCodeLabel = () => {
    const selected = statusCodeOptions.find(option => option.value === expectedStatus);
    return selected ? selected.label : expectedStatus;
  };
  
  // 处理状态码，将范围状态码（如2xx）转换为前缀数字（如2）以便与后端兼容
  const processStatusCode = (statusCode: string) => {
    // 检查是否为范围状态码格式（如2xx、3xx）
    if (/^\d+xx$/.test(statusCode)) {
      // 仅返回第一个数字
      return statusCode.charAt(0);
    }
    return statusCode;
  };
  
  // 使用 useEffect 处理导航
  useEffect(() => {
    if (shouldNavigate) {
      console.log('尝试使用多种方式导航到监控列表页面');
      
      // 方式1: 基本导航
      navigation.navigate('Monitors');
      
      // 方式2: 使用CommonActions重置导航
      const timerId = setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Monitors' }],
          })
        );
      }, 100);
      
      return () => clearTimeout(timerId);
    }
  }, [shouldNavigate, navigation]);
  
  const handleSubmit = async () => {
    if (!name.trim() || !url.trim()) {
      Alert.alert(
        t('monitors.createError', '创建错误'),
        t('monitors.fieldsRequired', '请填写所有必填字段')
      );
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 调用真实的API服务创建监控
      const result = await monitorService.createMonitor({
        name,
        url,
        method,
        interval: Number(interval),
        timeout: Number(timeoutValue),
        expectedStatus: processStatusCode(expectedStatus),
        headers: headersToJson(),
        body: ['POST', 'PUT', 'PATCH'].includes(method) ? body : undefined,
        type: 'http'
      });
      
      setIsLoading(false);
      
      if (result.success) {
        console.log('创建成功，准备跳转到监控列表页面');
        // 通过状态触发导航
        setShouldNavigate(true);
      } else {
        console.error('创建失败:', result.message);
        // 在Web中Alert可能不显示，使用console.error记录错误
        Alert.alert(
          t('monitors.createError', '创建错误'),
          result.message || t('monitors.createFailed', '创建监控失败')
        );
      }
    } catch (error) {
      setIsLoading(false);
      console.error('创建监控失败', error);
      // 在Web中Alert可能不显示，使用console.error记录错误
      Alert.alert(
        t('monitors.createError', '创建错误'),
        t('monitors.createFailed', '创建监控失败')
      );
    }
  };
  
  // 判断是否显示请求体输入框
  const showBodyField = ['POST', 'PUT', 'PATCH'].includes(method);
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.formContainer}>
        <Text style={styles.label}>{t('monitors.name', '名称')} *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('monitors.enterName', '输入监控名称')}
        />
        
        <Text style={styles.label}>{t('monitors.url', 'URL/主机')} *</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder={t('monitors.enterUrl', '输入要监控的 URL 或主机')}
        />
        
        <Text style={styles.label}>{t('monitors.method', '请求方法')} *</Text>
        <View style={styles.methodContainer}>
          {httpMethods.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.methodButton,
                method === m && styles.methodButtonActive
              ]}
              onPress={() => setMethod(m)}
            >
              <Text
                style={[
                  styles.methodButtonText,
                  method === m && styles.methodButtonTextActive
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.label}>{t('monitors.interval', '检查间隔 (秒)')}</Text>
        <TextInput
          style={styles.input}
          value={interval}
          onChangeText={setInterval}
          keyboardType="numeric"
        />
        
        <Text style={styles.label}>{t('monitors.timeout', '超时 (秒)')}</Text>
        <TextInput
          style={styles.input}
          value={timeoutValue}
          onChangeText={setTimeoutValue}
          keyboardType="numeric"
        />
        
        <Text style={styles.label}>{t('monitors.expectedStatus', '预期状态码')} *</Text>
        <TouchableOpacity 
          style={styles.dropdown}
          onPress={() => setStatusModalVisible(true)}
        >
          <Text style={styles.dropdownText}>
            {getSelectedStatusCodeLabel()}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        
        <Text style={styles.label}>{t('monitors.headers', '请求头')}</Text>
        <View style={styles.headerContainer}>
          {headers.map((header, index) => (
            <View key={index} style={styles.headerRow}>
              <TextInput
                style={[styles.input, styles.headerKeyInput]}
                value={header.key}
                onChangeText={(value) => updateHeader(index, 'key', value)}
                placeholder={t('monitors.headerName', '名称')}
              />
              <TextInput
                style={[styles.input, styles.headerValueInput]}
                value={header.value}
                onChangeText={(value) => updateHeader(index, 'value', value)}
                placeholder={t('monitors.headerValue', '值')}
              />
              <TouchableOpacity
                style={styles.headerRemoveButton}
                onPress={() => removeHeader(index)}
              >
                <Ionicons name="trash-outline" size={20} color="#f76363" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addHeaderButton} onPress={addHeader}>
            <Ionicons name="add-circle-outline" size={20} color="#0066cc" />
            <Text style={styles.addHeaderText}>{t('monitors.addHeader', '添加请求头')}</Text>
          </TouchableOpacity>
        </View>
        
        {showBodyField && (
          <>
            <Text style={styles.label}>{t('monitors.body', '请求体')}</Text>
            <TextInput
              style={[styles.input, styles.bodyInput]}
              value={body}
              onChangeText={setBody}
              placeholder={t('monitors.bodyPlaceholder', '输入请求体内容，例如 JSON 数据')}
              multiline
            />
          </>
        )}
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              {t('monitors.create', '创建监控')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* 状态码选择模态框 */}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('monitors.selectStatusCode', '选择状态码')}</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setStatusModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={statusCodeOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    expectedStatus === item.value && styles.statusOptionSelected
                  ]}
                  onPress={() => {
                    setExpectedStatus(item.value);
                    setStatusModalVisible(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.statusOptionText,
                      expectedStatus === item.value && styles.statusOptionTextSelected
                    ]}
                  >
                    {item.label}
                  </Text>
                  {expectedStatus === item.value && (
                    <Ionicons name="checkmark" size={20} color="#0066cc" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.modalList}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 100, // 添加底部间距，避免被导航栏遮挡
  },
  formContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  methodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  methodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  methodButtonActive: {
    backgroundColor: '#0066cc',
  },
  methodButtonText: {
    fontWeight: '500',
    color: '#333',
  },
  methodButtonTextActive: {
    color: '#fff',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
  },
  headerContainer: {
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerKeyInput: {
    flex: 2,
    marginRight: 8,
  },
  headerValueInput: {
    flex: 3,
    marginRight: 8,
  },
  headerRemoveButton: {
    padding: 8,
  },
  addHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addHeaderText: {
    fontSize: 14,
    color: '#0066cc',
    marginLeft: 4,
  },
  bodyInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32, // 增加底部边距
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // 模态框样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
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
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalList: {
    maxHeight: 300,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusOptionSelected: {
    backgroundColor: '#f0f7ff',
  },
  statusOptionText: {
    fontSize: 16,
    color: '#333',
  },
  statusOptionTextSelected: {
    color: '#0066cc',
    fontWeight: '500',
  },
});

export default CreateMonitorScreen; 