import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAppTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDate } from '../contexts/DateContext';
import { User } from '../types';

export const ProfileScreen = ({ user }: { user: User }) => {
  const { logout, setUser } = useAuth();
  const [nickname, setNickname] = useState(user.nickname || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useAppTheme();
  const { selectedYear, setSelectedYear, availableYears } = useDate();
  const [showYearPicker, setShowYearPicker] = useState(false);

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('Error', 'Nickname cannot be empty');
      return;
    }
    
    setLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ nickname: nickname.trim() })
      .eq('id', user.id);
      
    setLoading(false);
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Update the user in AuthContext with new nickname
      const updatedUser = { ...user, nickname: nickname.trim() };
      setUser(updatedUser);
      Alert.alert('Success', 'Nickname updated successfully!');
      setEditing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() }
      ]
    );
  };

  const getInitials = () => {
    if (user.nickname) return user.nickname.substring(0, 2).toUpperCase();
    if (user.email) return user.email.substring(0, 2).toUpperCase();
    return 'U';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {user.nickname || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
            {user.email}
          </Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account</Text>
          
          {/* Nickname */}
          <View style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingContent}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>Nickname</Text>
                {editing ? (
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="Enter nickname"
                    placeholderTextColor={theme.colors.textSecondary}
                    autoFocus
                  />
                ) : (
                  <Text style={[styles.settingValue, { color: theme.colors.text }]}>
                    {user.nickname || 'Not set'}
                  </Text>
                )}
              </View>
            </View>
            {editing ? (
              <View style={styles.editActions}>
                <TouchableOpacity
                  onPress={() => {
                    setNickname(user.nickname || '');
                    setEditing(false);
                  }}
                  style={styles.actionButton}
                >
                  <Ionicons name="close" size={20} color={theme.colors.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={styles.actionButton}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Ionicons name="checkmark" size={20} color={theme.colors.success} />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Ionicons name="pencil" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Email */}
          <View style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingContent}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>Email</Text>
                <Text style={[styles.settingValue, { color: theme.colors.text }]}>{user.email}</Text>
              </View>
            </View>
            <Ionicons name="lock-closed" size={16} color={theme.colors.textSecondary} />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Preferences</Text>
          
          {/* Theme Toggle */}
          <View style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingContent}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name={theme.dark ? "moon" : "sunny"} size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>Theme</Text>
                <Text style={[styles.settingValue, { color: theme.colors.text }]}>
                  {theme.dark ? 'Dark' : 'Light'}
                </Text>
              </View>
            </View>
            <ThemeToggle />
          </View>

          {/* Year Selector */}
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => setShowYearPicker(!showYearPicker)}
          >
            <View style={styles.settingContent}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>Selected Year</Text>
                <Text style={[styles.settingValue, { color: theme.colors.text }]}>{selectedYear}</Text>
              </View>
            </View>
            <Ionicons name={showYearPicker ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {/* Year Picker Dropdown */}
          {showYearPicker && (
            <View style={[styles.yearPicker, { backgroundColor: theme.colors.surface }]}>
              {availableYears.map(year => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearOption,
                    { borderBottomColor: theme.colors.border },
                    selectedYear === year && { backgroundColor: theme.colors.primary + '10' }
                  ]}
                  onPress={() => {
                    setSelectedYear(year);
                    setShowYearPicker(false);
                  }}
                >
                  <Text style={[
                    styles.yearText,
                    { color: theme.colors.text },
                    selectedYear === year && { color: theme.colors.primary, fontWeight: 'bold' }
                  ]}>
                    {year}
                  </Text>
                  {selectedYear === year && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: theme.colors.error }]} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: theme.colors.textSecondary }]}>
            Expense Tracker v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 30,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    borderBottomWidth: 1,
    paddingVertical: 4,
    marginTop: 2,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  yearPicker: {
    marginTop: -8,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  yearOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  yearText: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  appInfoText: {
    fontSize: 12,
    marginBottom: 4,
  },
});