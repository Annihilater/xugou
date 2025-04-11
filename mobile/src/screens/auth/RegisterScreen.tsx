import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '../../store/authStore';

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  { Register: undefined; Login: undefined },
  'Register'
>;

const RegisterScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  
  const { register, isLoading, error } = useAuthStore();
  
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  const handleRegister = async () => {
    // 重置错误
    setUsernameError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setEmailError('');
    
    // 表单验证
    let isValid = true;
    
    if (!username.trim()) {
      setUsernameError(t('auth.usernameRequired'));
      isValid = false;
    }
    
    if (!password) {
      setPasswordError(t('auth.passwordRequired'));
      isValid = false;
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError(t('auth.passwordsDoNotMatch'));
      isValid = false;
    }
    
    if (email && !validateEmail(email)) {
      setEmailError(t('auth.emailInvalid'));
      isValid = false;
    }
    
    if (!isValid) {
      return;
    }
    
    // 执行注册
    const success = await register({ username, password, email });
    
    if (success) {
      Alert.alert(t('common.success'), t('auth.registerSuccess'), [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } else if (error) {
      Alert.alert(t('common.error'), error);
    }
  };
  
  const goToLogin = () => {
    navigation.navigate('Login');
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{t('auth.register')}</Text>
          <Text style={styles.subtitle}>XUGOU 监控</Text>
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.username')}</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder={t('auth.username')}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            {usernameError ? (
              <Text style={styles.errorText}>{usernameError}</Text>
            ) : null}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password')}
              secureTextEntry
              placeholderTextColor="#999"
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('auth.confirmPassword')}
              secureTextEntry
              placeholderTextColor="#999"
            />
            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            ) : null}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.email')}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#999"
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>{t('auth.register')}</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>{t('auth.alreadyHaveAccount', "已有账号？")} </Text>
          <TouchableOpacity onPress={goToLogin}>
            <Text style={styles.loginLink}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32, // Add vertical padding for scroll view
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32, // Adjust spacing
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: 'bold',
  },
});

export default RegisterScreen; 