import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { API_BASE_URL } from '../../config/api';
import agentService from '../../api/agents';

const CreateAgentScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  // 状态
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState(API_BASE_URL);
  const [selectedPlatform, setSelectedPlatform] = useState('linux');
  const [selectedArch, setSelectedArch] = useState('amd64');
  const [copied, setCopied] = useState(false);
  
  // 页面加载时自动获取注册token
  useEffect(() => {
    generateToken();
  }, []);
  
  // 生成注册token
  const generateToken = async () => {
    setIsLoading(true);
    try {
      const tokenResult = await agentService.generateRegistrationToken();
      
      if (!tokenResult) {
        setIsLoading(false);
        Alert.alert(
          t('agents.tokenError', 'Token生成错误'),
          t('agents.tokenFailed', '无法生成客户端注册Token')
        );
        return;
      }
      
      setToken(tokenResult);
      setIsLoading(false);
    } catch (error) {
      console.error('生成Token失败', error);
      setIsLoading(false);
      Alert.alert(
        t('common.error', '错误'),
        t('agents.tokenFailed', '无法生成客户端注册Token')
      );
    }
  };
  
  // 复制命令到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制到剪贴板失败', error);
    }
  };
  
  // 获取下载URL
  const getDownloadUrl = () => {
    if (!selectedPlatform || !selectedArch) return '';
    const extension = selectedPlatform === 'windows' ? '.exe' : '';
    return `https://dl.xugou.mdzz.uk/latest/xugou-agent-${selectedPlatform}-${selectedArch}${extension}`;
  };
  
  // 获取下载命令
  const getDownloadCommand = () => {
    if (!selectedPlatform || !selectedArch || selectedPlatform === 'windows') return '';
    return `curl -sSL ${getDownloadUrl()} -o xugou-agent && chmod +x xugou-agent`;
  };
  
  // 获取运行命令
  const getRunCommand = () => {
    return `./xugou-agent start --server ${serverUrl} --token ${token} --interval 60`;
  };

  // 加载中状态
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>{t('agents.generatingToken', '正在生成注册Token...')}</Text>
      </View>
    );
  }

  // 显示安装指南
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.formContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('agents.addNewAgent', '添加新客户端')}</Text>
          <Text style={styles.description}>
            {t('agents.followGuide', '请按照以下步骤安装客户端')}
          </Text>
        </View>
        
        {/* 服务器地址部分 */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('agents.serverAddress', '服务器地址')}</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{serverUrl}</Text>
          </View>
          <TouchableOpacity 
            style={styles.copyButton}
            onPress={() => copyToClipboard(serverUrl)}
          >
            <Text style={styles.copyButtonText}>
              {copied ? t('common.copied', '已复制') : t('common.copy', '复制')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* 客户端Token部分 */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('agents.registrationToken', '注册令牌')}</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{token}</Text>
          </View>
          <TouchableOpacity 
            style={styles.copyButton}
            onPress={() => copyToClipboard(token)}
          >
            <Text style={styles.copyButtonText}>
              {copied ? t('common.copied', '已复制') : t('common.copy', '复制')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* 选择平台部分 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('agents.installGuide', '安装指南')}</Text>
          
          <Text style={styles.label}>{t('agents.selectPlatform', '1. 选择操作系统')}</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.optionButton, selectedPlatform === 'linux' && styles.selectedOption]}
              onPress={() => setSelectedPlatform('linux')}
            >
              <Text style={[styles.optionText, selectedPlatform === 'linux' && styles.selectedOptionText]}>Linux</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, selectedPlatform === 'darwin' && styles.selectedOption]}
              onPress={() => setSelectedPlatform('darwin')}
            >
              <Text style={[styles.optionText, selectedPlatform === 'darwin' && styles.selectedOptionText]}>macOS</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, selectedPlatform === 'windows' && styles.selectedOption]}
              onPress={() => setSelectedPlatform('windows')}
            >
              <Text style={[styles.optionText, selectedPlatform === 'windows' && styles.selectedOptionText]}>Windows</Text>
            </TouchableOpacity>
          </View>
          
          {/* 选择架构部分 */}
          <Text style={styles.label}>{t('agents.selectArch', '2. 选择系统架构')}</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.optionButton, selectedArch === 'amd64' && styles.selectedOption]}
              onPress={() => setSelectedArch('amd64')}
            >
              <Text style={[styles.optionText, selectedArch === 'amd64' && styles.selectedOptionText]}>
                {selectedPlatform === 'darwin' ? 'AMD64 (Intel)' : 'AMD64 (x86_64)'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, selectedArch === 'arm64' && styles.selectedOption]}
              onPress={() => setSelectedArch('arm64')}
            >
              <Text style={[styles.optionText, selectedArch === 'arm64' && styles.selectedOptionText]}>
                {selectedPlatform === 'darwin' ? 'ARM64 (Apple Silicon)' : 'ARM64'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 下载命令部分 */}
        {selectedPlatform === 'windows' ? (
          <View style={styles.section}>
            <Text style={styles.label}>{t('agents.downloadInstaller', '3. 下载安装文件')}</Text>
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={() => Linking.openURL(getDownloadUrl())}
            >
              <Text style={styles.downloadButtonText}>
                {t('agents.downloadWindows', '下载 Windows 安装程序')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.label}>{t('agents.downloadRun', '3. 下载并安装')}</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{getDownloadCommand()}</Text>
            </View>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => copyToClipboard(getDownloadCommand())}
            >
              <Text style={styles.copyButtonText}>
                {copied ? t('common.copied', '已复制') : t('common.copy', '复制')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* 运行客户端部分 */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('agents.runAgent', '4. 运行客户端')}</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{getRunCommand()}</Text>
          </View>
          <TouchableOpacity 
            style={styles.copyButton}
            onPress={() => copyToClipboard(getRunCommand())}
          >
            <Text style={styles.copyButtonText}>
              {copied ? t('common.copied', '已复制') : t('common.copy', '复制')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* 返回按钮 */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>{t('agents.returnToList', '返回客户端列表')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={generateToken}
          >
            <Text style={styles.resetButtonText}>{t('agents.generateNewToken', '生成新Token')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#0066cc',
  },
  description: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
  },
  codeBlock: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  copyButton: {
    backgroundColor: '#e6e6e6',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  copyButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#e6e6e6',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedOption: {
    backgroundColor: '#0066cc',
  },
  optionText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#fff',
  },
  downloadButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 32,
  },
  secondaryButton: {
    backgroundColor: '#e6e6e6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  resetButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CreateAgentScreen; 