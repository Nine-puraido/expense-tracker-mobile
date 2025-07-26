import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';

export const AuthScreen: React.FC = () => {
  const { setUser } = useAuth();
  const { theme } = useAppTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !nickname) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await authService.signUp(email, password, nickname);
      if (error) {
        Alert.alert('Sign Up Error', error.message || 'Failed to create account');
      } else {
        Alert.alert('Success', 'Account created successfully! You can now sign in.');
        setIsSignUp(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await authService.signIn(email, password);
      if (error) {
        Alert.alert('Sign In Error', error.message || 'Invalid email or password');
      } else {
        setUser(data);
        Alert.alert('Success', `Welcome, ${data.nickname || data.email}!`);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    form: {
      marginBottom: 32,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    primaryButtonDisabled: {
      backgroundColor: theme.colors.border,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    primaryButtonTextDisabled: {
      color: theme.colors.textSecondary,
    },
    toggleContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    toggleText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    toggleButton: {
      marginLeft: 8,
    },
    toggleButtonText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    footer: {
      alignItems: 'center',
      marginTop: 32,
    },
    footerText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      textAlign: 'center',
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="wallet" size={64} color={theme.colors.primary} />
          <Text style={styles.title}>Expense Tracker</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Text>
        </View>

        <View style={styles.form}>
          {isSignUp && (
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="Nickname"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="words"
              autoCorrect={false}
            />
          )}

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.colors.textSecondary}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!email || !password || (isSignUp && !nickname) || loading) && styles.primaryButtonDisabled,
            ]}
            onPress={isSignUp ? handleSignUp : handleSignIn}
            disabled={!email || !password || (isSignUp && !nickname) || loading}
          >
            <Text
              style={[
                styles.primaryButtonText,
                (!email || !password || (isSignUp && !nickname) || loading) && styles.primaryButtonTextDisabled,
              ]}
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={loading}
          >
            <Text style={styles.toggleButtonText}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}; 