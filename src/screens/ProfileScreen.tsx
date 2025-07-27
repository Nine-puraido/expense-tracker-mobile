import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, authService, supabaseAuthService } from '../services/supabase';
import { exportService } from '../services/exportService';
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
  const [selectedExportMonth, setSelectedExportMonth] = useState(new Date().getMonth() + 1);
  const [selectedExportYear, setSelectedExportYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showExportYearPicker, setShowExportYearPicker] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [exporting, setExporting] = useState(false);


  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('Error', 'Nickname cannot be empty');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabaseAuthService.updateProfile({ nickname: nickname.trim() });
      
      if (error) {
        Alert.alert('Error', error.message || 'Failed to update nickname');
      } else {
        const updatedUser = { ...user, nickname: nickname.trim() };
        setUser(updatedUser);
        Alert.alert('Success', 'Nickname updated successfully!');
        setEditing(false);
      }
    } catch (exception) {
      Alert.alert('Error', 'Failed to update nickname. Please try again.');
    } finally {
      setLoading(false);
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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const exportYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleExport = async (format: 'json' | 'pdf') => {
    setExporting(true);
    try {
      const data = await exportService.getMonthlyData(user.id, selectedExportYear, selectedExportMonth);
      
      if (data.transactions.length === 0) {
        Alert.alert('No Data', `No transactions found for ${months[selectedExportMonth - 1]} ${selectedExportYear}`);
        return;
      }

      if (format === 'json') {
        await exportService.exportToJSON(data);
      } else {
        await exportService.exportToPDF(data);
      }

      Alert.alert('Success', `Data exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account</Text>
          
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Preferences</Text>
          
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Export Data</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => setShowDownloadOptions(!showDownloadOptions)}
          >
            <View style={styles.settingContent}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>Monthly Report</Text>
                <Text style={[styles.settingValue, { color: theme.colors.text }]}>Download Data</Text>
              </View>
            </View>
            <Ionicons name={showDownloadOptions ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {showDownloadOptions && (
            <View style={[styles.downloadOptionsContainer, { backgroundColor: theme.colors.surface }]}>
              <TouchableOpacity 
                style={[styles.settingItem, { backgroundColor: 'transparent', marginBottom: 0 }]}
                onPress={() => setShowExportYearPicker(!showExportYearPicker)}
              >
                <View style={styles.settingContent}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>Year</Text>
                    <Text style={[styles.settingValue, { color: theme.colors.text }]}>{selectedExportYear}</Text>
                  </View>
                </View>
                <Ionicons name={showExportYearPicker ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              {showExportYearPicker && (
                <View style={[styles.yearPicker, { backgroundColor: theme.colors.background, marginLeft: 16, marginRight: 16 }]}>
                  {exportYears.map(year => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearOption,
                        { borderBottomColor: theme.colors.border },
                        selectedExportYear === year && { backgroundColor: theme.colors.primary + '10' }
                      ]}
                      onPress={() => {
                        setSelectedExportYear(year);
                        setShowExportYearPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.yearText,
                        { color: theme.colors.text },
                        selectedExportYear === year && { color: theme.colors.primary, fontWeight: 'bold' }
                      ]}>
                        {year}
                      </Text>
                      {selectedExportYear === year && (
                        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity 
                style={[styles.settingItem, { backgroundColor: 'transparent', marginBottom: 0 }]}
                onPress={() => setShowMonthPicker(!showMonthPicker)}
              >
                <View style={styles.settingContent}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>Month</Text>
                    <Text style={[styles.settingValue, { color: theme.colors.text }]}>{months[selectedExportMonth - 1]}</Text>
                  </View>
                </View>
                <Ionicons name={showMonthPicker ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              {showMonthPicker && (
                <View style={[styles.yearPicker, { backgroundColor: theme.colors.background, marginLeft: 16, marginRight: 16 }]}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.yearOption,
                        { borderBottomColor: theme.colors.border },
                        selectedExportMonth === index + 1 && { backgroundColor: theme.colors.primary + '10' }
                      ]}
                      onPress={() => {
                        setSelectedExportMonth(index + 1);
                        setShowMonthPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.yearText,
                        { color: theme.colors.text },
                        selectedExportMonth === index + 1 && { color: theme.colors.primary, fontWeight: 'bold' }
                      ]}>
                        {month}
                      </Text>
                      {selectedExportMonth === index + 1 && (
                        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.exportButtons}>
                <TouchableOpacity 
                  style={[styles.exportButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleExport('json')}
                  disabled={exporting}
                >
                  {exporting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="code-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.exportButtonText}>JSON</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.exportButton, { backgroundColor: theme.colors.error }]}
                  onPress={() => handleExport('pdf')}
                  disabled={exporting}
                >
                  {exporting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.exportButtonText}>PDF</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: theme.colors.error }]} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

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
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  downloadOptionsContainer: {
    marginTop: -8,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    paddingVertical: 8,
  },
});