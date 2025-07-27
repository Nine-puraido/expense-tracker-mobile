import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, Animated, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { createShadowStyle } from '../utils/shadowStyles';
import { User, Transaction, Category } from '../types';

const { width } = Dimensions.get('window');


const ICON_EMOJI_MAP: Record<string, string> = {
  car: '🚗',
  restaurant: '🍽️',
  shirt: '👕',
  laptop: '💻',
  'shopping-cart': '🛒',
  home: '🏠',
  'file-text': '📄',
  briefcase: '💼',
  'trending-up': '📈',
  'plus-circle': '➕',
  'medical-outline': '🏥',
  'shirt-outline': '👕',
  'laptop-outline': '💻',
  basket: '🛒',
};

export const HomeScreen = ({ user }: { user: User }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0');
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [period, setPeriod] = useState<'daily' | 'month' | '2weeks' | 'year' | 'custom'>('month');
  const [customStart, setCustomStart] = useState(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return first.getFullYear() + '-' + 
      String(first.getMonth() + 1).padStart(2, '0') + '-' + 
      String(first.getDate()).padStart(2, '0');
  });
  const [customEnd, setCustomEnd] = useState(() => {
    const now = new Date();
    return now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0');
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const { theme } = useAppTheme();
  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [280, 200],
    extrapolate: 'clamp',
  });

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.dark ? '#0A0A0A' : '#F5F7FA',
    },
    header: {
      paddingTop: 60,
      paddingBottom: 30,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 35,
      borderBottomRightRadius: 35,
      overflow: 'hidden',
    },
    headerGradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    welcomeText: {
      fontSize: 32,
      fontWeight: '800',
      color: '#fff',
      marginBottom: 4,
      letterSpacing: -0.5,
    },
    subWelcomeText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: 20,
      fontWeight: '500',
    },
    balanceCard: {
      borderRadius: 24,
      padding: 20,
      marginBottom: 20,
      overflow: 'hidden',
    },
    balanceBlur: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      borderRadius: 24,
    },
    balanceLabel: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: 8,
      textAlign: 'center',
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    balanceAmount: {
      fontSize: 36,
      fontWeight: '900',
      color: '#fff',
      textAlign: 'center',
      marginBottom: 10,
      letterSpacing: -1,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    balanceToggle: {
      padding: 8,
    },
    periodSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: 20,
      marginVertical: 20,
      backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
      borderRadius: 16,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    periodBtn: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 12,
      alignItems: 'center',
    },
    periodBtnActive: {
      backgroundColor: theme.dark ? '#3B82F6' : '#2563EB',
      ...createShadowStyle({
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
      }),
    },
    periodBtnText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    periodBtnTextActive: {
      color: '#fff',
      fontWeight: 'bold',
    },
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: 20,
      marginBottom: 25,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
      borderRadius: 20,
      padding: 16,
      marginHorizontal: 4,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    summaryIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    summaryIconGradient: {
      width: '100%',
      height: '100%',
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
      textAlign: 'center',
    },
    summaryAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    dateSection: {
      marginHorizontal: 20,
      marginBottom: 20,
    },
    dateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    dateNavBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    dateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      textAlign: 'center',
    },
    datePickerBtn: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 20,
      alignSelf: 'center',
      overflow: 'hidden',
    },
    datePickerGradient: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    datePickerBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    transactionsList: {
      flex: 1,
      paddingHorizontal: 20,
    },
    transactionCard: {
      backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
      borderRadius: 20,
      padding: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    transactionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    categoryIconText: {
      fontSize: 24,
      color: '#fff',
    },
    transactionInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    transactionDesc: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    transactionAmountSection: {
      alignItems: 'flex-end',
    },
    transactionAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'right',
      marginBottom: 4,
    },
    transactionTimeSection: {
      alignItems: 'flex-end',
    },
    transactionTime: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      textAlign: 'right',
    },
    transactionDate: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      textAlign: 'right',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    customDateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 20,
      marginBottom: 20,
      gap: 10,
    },
    customDateBtn: {
      flex: 1,
      backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    customDateBtnText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    datePickerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    datePickerModal: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      margin: 20,
      padding: 20,
      minWidth: width * 0.8,
      maxWidth: width * 0.9,
      elevation: 8,
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    datePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    datePickerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    datePickerCloseButton: {
      padding: 8,
      borderRadius: 12,
    },
    datePickerButtonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    datePicker: {
      backgroundColor: theme.colors.surface,
    },
  }), [theme]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        const fetchTransactions = async () => {
          setLoading(true);
          try {
            await new Promise(resolve => setTimeout(resolve, 400));
            
            const { data, error } = await supabase
              .from('transactions')
              .select('*')
              .eq('user_id', user.id)
              .order('transaction_date', { ascending: false })
              .limit(100);
            
            if (!error && data) {
              setTransactions(data as Transaction[]);
            } else {
              setTransactions([]);
            }
          } catch (error) {
            setTransactions([]);
          } finally {
            setLoading(false);
          }
        };
        fetchTransactions();
      }
    }, [user])
  );

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('id, name, color, icon');
      if (!error && data) setCategories(data as unknown as Category[]);
    };
    fetchCategories();
  }, []);

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Unknown';
  };

  const getDateNDaysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.getFullYear() + '-' + 
      String(d.getMonth() + 1).padStart(2, '0') + '-' + 
      String(d.getDate()).padStart(2, '0');
  };

  let rangeStart = '';
  let rangeEnd = '';
  if (period === 'daily') {
    rangeStart = selectedDate;
    rangeEnd = selectedDate;
  } else if (period === 'month') {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    rangeStart = first.getFullYear() + '-' + 
      String(first.getMonth() + 1).padStart(2, '0') + '-' + 
      String(first.getDate()).padStart(2, '0');
    rangeEnd = last.getFullYear() + '-' + 
      String(last.getMonth() + 1).padStart(2, '0') + '-' + 
      String(last.getDate()).padStart(2, '0');
  } else if (period === '2weeks') {
    rangeStart = getDateNDaysAgo(13);
    const now = new Date();
    rangeEnd = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0');
  } else if (period === 'year') {
    const now = new Date();
    const first = new Date(now.getFullYear(), 0, 1);
    const last = new Date(now.getFullYear(), 11, 31);
    rangeStart = first.getFullYear() + '-' + 
      String(first.getMonth() + 1).padStart(2, '0') + '-' + 
      String(first.getDate()).padStart(2, '0');
    rangeEnd = last.getFullYear() + '-' + 
      String(last.getMonth() + 1).padStart(2, '0') + '-' + 
      String(last.getDate()).padStart(2, '0');
  } else if (period === 'custom') {
    rangeStart = customStart;
    rangeEnd = customEnd;
  }

  const summaryTransactions = transactions.filter(t => t.transaction_date >= rangeStart && t.transaction_date <= rangeEnd);
  const totalIncome = summaryTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = summaryTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const net = totalIncome - totalExpenses;

  const formatAmount = (amount: number) => {
    return Math.round(amount).toLocaleString();
  };

  const dayTransactions = transactions
    .filter(t => t.transaction_date === selectedDate)
    .sort((a, b) => {
      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
    });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const changeDay = (delta: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + delta);
    setSelectedDate(date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0'));
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date.getFullYear() + '-' + 
        String(date.getMonth() + 1).padStart(2, '0') + '-' + 
        String(date.getDate()).padStart(2, '0'));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.emptyStateText, { marginTop: 16 }]}>Loading your transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.header, { height: headerHeight }]}>
          <LinearGradient
            colors={theme.dark 
              ? ['#1E3A8A', '#3B82F6', '#60A5FA'] 
              : ['#2563EB', '#3B82F6', '#60A5FA']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          />
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.subWelcomeText}>{user.nickname || user.email}</Text>
          
          <View style={styles.balanceCard}>
            <BlurView intensity={80} tint={theme.dark ? 'dark' : 'light'} style={styles.balanceBlur}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
            </BlurView>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>
                ฿ {showBalance ? formatAmount(net) : '••••••'}
              </Text>
              <TouchableOpacity 
                style={styles.balanceToggle}
                onPress={() => setShowBalance(!showBalance)}
              >
                <Ionicons 
                  name={showBalance ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="rgba(255, 255, 255, 0.8)" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <View style={styles.periodSelector}>
          <TouchableOpacity 
            onPress={() => setPeriod('daily')} 
            style={[styles.periodBtn, period === 'daily' && styles.periodBtnActive]}
          >
            <Text style={[styles.periodBtnText, period === 'daily' && styles.periodBtnTextActive]}>
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setPeriod('2weeks')} 
            style={[styles.periodBtn, period === '2weeks' && styles.periodBtnActive]}
          >
            <Text style={[styles.periodBtnText, period === '2weeks' && styles.periodBtnTextActive]}>
              2 Weeks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setPeriod('month')} 
            style={[styles.periodBtn, period === 'month' && styles.periodBtnActive]}
          >
            <Text style={[styles.periodBtnText, period === 'month' && styles.periodBtnTextActive]}>
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setPeriod('year')} 
            style={[styles.periodBtn, period === 'year' && styles.periodBtnActive]}
          >
            <Text style={[styles.periodBtnText, period === 'year' && styles.periodBtnTextActive]}>
              Year
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setPeriod('custom')} 
            style={[styles.periodBtn, period === 'custom' && styles.periodBtnActive]}
          >
            <Text style={[styles.periodBtnText, period === 'custom' && styles.periodBtnTextActive]}>
              Custom
            </Text>
          </TouchableOpacity>
        </View>

        {period === 'custom' && (
          <View style={styles.customDateRow}>
            <TouchableOpacity 
              onPress={() => setShowStartPicker(true)} 
              style={styles.customDateBtn}
            >
              <Text style={styles.customDateBtnText}>Start: {customStart}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowEndPicker(true)} 
              style={styles.customDateBtn}
            >
              <Text style={styles.customDateBtnText}>End: {customEnd}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <LinearGradient
                colors={['#10B981', '#34D399']}
                style={styles.summaryIconGradient}
              >
                <Ionicons name="trending-up" size={24} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryAmount, { color: '#10B981' }]}> 
              ฿ {formatAmount(totalIncome)}
            </Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <LinearGradient
                colors={['#EF4444', '#F87171']}
                style={styles.summaryIconGradient}
              >
                <Ionicons name="trending-down" size={24} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryAmount, { color: '#EF4444' }]}> 
              ฿ {formatAmount(totalExpenses)}
            </Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <LinearGradient
                colors={net >= 0 ? ['#10B981', '#34D399'] : ['#EF4444', '#F87171']}
                style={styles.summaryIconGradient}
              >
                <Ionicons name="wallet" size={24} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={[styles.summaryAmount, { color: net >= 0 ? '#10B981' : '#EF4444' }]}> 
              ฿ {formatAmount(net)}
            </Text>
          </View>
        </View>

        <View style={styles.dateSection}>
          <View style={styles.dateHeader}>
            <TouchableOpacity 
              style={styles.dateNavBtn}
              onPress={() => changeDay(-1)}
            >
              <Ionicons name="chevron-back" size={20} color={theme.dark ? '#fff' : '#000'} />
            </TouchableOpacity>
            
            <Text style={styles.dateTitle}>
              {formatDate(selectedDate)}
            </Text>
            
            <TouchableOpacity 
              style={styles.dateNavBtn}
              onPress={() => changeDay(1)}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.dark ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.datePickerBtn} 
            onPress={() => setShowDatePicker(true)}
          >
            <LinearGradient
              colors={theme.dark ? ['#3B82F6', '#2563EB'] : ['#3B82F6', '#1D4ED8']}
              style={styles.datePickerGradient}
            >
              <Ionicons name="calendar" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.datePickerBtnText}>Pick Date</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsList}>
          {dayTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={theme.dark ? ['#1E3A8A', '#3B82F6'] : ['#3B82F6', '#60A5FA']}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons name="receipt-outline" size={40} color="#fff" />
              </LinearGradient>
              <Text style={styles.emptyStateText}>
                No transactions for this day{'\n'}
                Start tracking your expenses!
              </Text>
      </View>
          ) : (
            dayTransactions.map(tx => {
              const category = categories.find(c => c.id === tx.category_id);
              return (
                <View key={tx.id} style={styles.transactionCard}>
                  <View style={styles.transactionHeader}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: category?.color || '#ccc' },
                      ]}
                    >
                      <Text style={styles.categoryIconText}>
                        {category?.icon ? 
                          (ICON_EMOJI_MAP[category.icon] || category.icon || (category?.name ? category.name[0] : '?')) :
                          (category?.name ? category.name[0] : '?')
                        }
                      </Text>
                    </View>
                    
                    <View style={styles.transactionInfo}>
                      <Text style={styles.categoryName}>
                        {category ? category.name : 'Unknown'}
                      </Text>
                      {tx.description && !tx.description.endsWith(' expense') && !tx.description.endsWith(' income') && (
                        <Text style={styles.transactionDesc}>{tx.description}</Text>
                      )}
                    </View>
                    
                    <View style={styles.transactionAmountSection}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          { color: tx.type === 'income' ? '#4CAF50' : '#F44336' },
                        ]}
                      >
                        {tx.type === 'income' ? '+' : '-'}฿ {formatAmount(tx.amount)}
                      </Text>
                      {tx.created_at && (
                        <Text style={styles.transactionTime}>
                          {formatTime(tx.created_at)}
                        </Text>
                      )}
                    </View>
              </View>
              </View>
              );
            })
          )}
            </View>
        </Animated.ScrollView>

      {showDatePicker && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity 
                style={styles.datePickerCloseButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.datePickerButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.datePickerTitle, { color: theme.colors.text }]}>Select Date</Text>
              <TouchableOpacity 
                style={styles.datePickerCloseButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.datePickerButtonText, { color: theme.colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={new Date(selectedDate)}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              style={styles.datePicker}
            />
          </View>
        </View>
      )}
      
      {showStartPicker && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity 
                style={styles.datePickerCloseButton}
                onPress={() => setShowStartPicker(false)}
              >
                <Text style={[styles.datePickerButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.datePickerTitle, { color: theme.colors.text }]}>Select Start Date</Text>
              <TouchableOpacity 
                style={styles.datePickerCloseButton}
                onPress={() => setShowStartPicker(false)}
              >
                <Text style={[styles.datePickerButtonText, { color: theme.colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={new Date(customStart)}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (Platform.OS === 'android') {
                  setShowStartPicker(false);
                }
                if (date) {
                  setCustomStart(date.getFullYear() + '-' + 
                    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(date.getDate()).padStart(2, '0'));
                }
              }}
              style={styles.datePicker}
            />
          </View>
        </View>
      )}
      
      {showEndPicker && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity 
                style={styles.datePickerCloseButton}
                onPress={() => setShowEndPicker(false)}
              >
                <Text style={[styles.datePickerButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.datePickerTitle, { color: theme.colors.text }]}>Select End Date</Text>
              <TouchableOpacity 
                style={styles.datePickerCloseButton}
                onPress={() => setShowEndPicker(false)}
              >
                <Text style={[styles.datePickerButtonText, { color: theme.colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={new Date(customEnd)}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (Platform.OS === 'android') {
                  setShowEndPicker(false);
                }
                if (date) {
                  setCustomEnd(date.getFullYear() + '-' + 
                    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(date.getDate()).padStart(2, '0'));
                }
              }}
              style={styles.datePicker}
            />
          </View>
        </View>
      )}
    </View>
  );
};