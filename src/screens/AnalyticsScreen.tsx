import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity, Animated, Modal, Platform, Button, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { supabase } from '../services/supabase';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../contexts/ThemeContext';
import { User, Transaction, Category } from '../types';
import { ExpenseChart } from '../components/ExpenseChart';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';

export const AnalyticsScreen = ({ user }: { user: User }) => {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [chartData, setChartData] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 140],
    extrapolate: 'clamp',
  });
  const [period, setPeriod] = useState<'2weeks' | 'month' | 'custom'>('month');
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
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefreshing = false) => {
    if (!user) return;
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);
      if (!error && data) {
        setData(data as Transaction[]);
        if (!isRefreshing) {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]).start();
        }
      } else {
        setData([]);
      }
    } catch (error) {
      setData([]);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [user, fadeAnim, slideAnim]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    if (!data.length) {
      setChartData(null);
      return;
    }
    let labels: string[] = [];
    let incomeData: number[] = [];
    let expenseData: number[] = [];
    const now = new Date();
    if (view === 'daily') {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        return d;
      });
      labels = days.map(d => `${d.getMonth() + 1}/${d.getDate()}`);
      incomeData = days.map(d => {
        const dateStr = d.getFullYear() + '-' + 
          String(d.getMonth() + 1).padStart(2, '0') + '-' + 
          String(d.getDate()).padStart(2, '0');
        return data.filter(t => t.type === 'income' && t.transaction_date === dateStr).reduce((sum, t) => sum + t.amount, 0);
      });
      expenseData = days.map(d => {
        const dateStr = d.getFullYear() + '-' + 
          String(d.getMonth() + 1).padStart(2, '0') + '-' + 
          String(d.getDate()).padStart(2, '0');
        return data.filter(t => t.type === 'expense' && t.transaction_date === dateStr).reduce((sum, t) => sum + t.amount, 0);
      });
    } else if (view === 'weekly') {
      const year = now.getFullYear();
      const weekMap: { [key: string]: { income: number; expense: number; start: Date; end: Date } } = {};
      data.forEach((t: any) => {
        const date = new Date(t.transaction_date);
        if (date.getFullYear() === year) {
          const day = date.getDay();
          const diffToMonday = (day + 6) % 7;
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - diffToMonday);
          weekStart.setHours(0,0,0,0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(0,0,0,0);
          const key = weekStart.getFullYear() + '-' + 
            String(weekStart.getMonth() + 1).padStart(2, '0') + '-' + 
            String(weekStart.getDate()).padStart(2, '0');
          if (!weekMap[key]) weekMap[key] = { income: 0, expense: 0, start: new Date(weekStart), end: new Date(weekEnd) };
          if (t.type === 'income') weekMap[key].income += t.amount;
          if (t.type === 'expense') weekMap[key].expense += t.amount;
        }
      });
      const sortedWeeks = Object.values(weekMap).sort((a, b) => a.start.getTime() - b.start.getTime());
      labels = sortedWeeks.map(w => {
        const start = w.start;
        const end = w.end;
        const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${startLabel}-${endLabel}`;
      });
      incomeData = sortedWeeks.map(w => Number(w.income) || 0);
      expenseData = sortedWeeks.map(w => Number(w.expense) || 0);
    } else if (view === 'monthly') {
      const year = now.getFullYear();
      const months: { [key: string]: { income: number; expense: number } } = {};
      for (let m = 0; m < 12; m++) {
        const monthLabel = new Date(year, m, 1).toLocaleDateString('en-US', { month: 'short' });
        months[monthLabel] = { income: 0, expense: 0 };
      }
      data.forEach((t: any) => {
        const date = new Date(t.transaction_date);
        if (date.getFullYear() === year) {
          const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
          if (t.type === 'income') months[monthLabel].income += t.amount;
          if (t.type === 'expense') months[monthLabel].expense += t.amount;
        }
      });
      labels = Object.keys(months);
      incomeData = labels.map(l => Number(months[l].income) || 0);
      expenseData = labels.map(l => Number(months[l].expense) || 0);
    } else if (view === 'yearly') {
      const years: { [key: string]: { income: number; expense: number } } = {};
      for (let y = now.getFullYear() - 4; y <= now.getFullYear(); y++) {
        years[y] = { income: 0, expense: 0 };
      }
      data.forEach((t: any) => {
        const date = new Date(t.transaction_date);
        const y = date.getFullYear();
        if (years[y] !== undefined) {
          if (t.type === 'income') years[y].income += t.amount;
          if (t.type === 'expense') years[y].expense += t.amount;
        }
      });
      labels = Object.keys(years);
      incomeData = labels.map(l => Number(years[l].income) || 0);
      expenseData = labels.map(l => Number(years[l].expense) || 0);
    }
    setChartData({ labels, incomeData, expenseData });
  }, [data, view]);

  let rangeStart = '';
  let rangeEnd = '';
  if (period === 'month') {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    rangeStart = first.getFullYear() + '-' + 
      String(first.getMonth() + 1).padStart(2, '0') + '-' + 
      String(first.getDate()).padStart(2, '0');
    rangeEnd = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0');
  } else if (period === '2weeks') {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    rangeStart = d.getFullYear() + '-' + 
      String(d.getMonth() + 1).padStart(2, '0') + '-' + 
      String(d.getDate()).padStart(2, '0');
    const now = new Date();
    rangeEnd = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0');
  } else if (period === 'custom') {
    rangeStart = customStart;
    rangeEnd = customEnd;
  }

  const filteredData = data.filter(t => t.transaction_date >= rangeStart && t.transaction_date <= rangeEnd);

  let totalIncome = 0;
  let totalExpense = 0;
  if (chartData) {
    totalIncome = chartData.incomeData.reduce((sum: number, v: number) => sum + v, 0);
    totalExpense = chartData.expenseData.reduce((sum: number, v: number) => sum + v, 0);
  }

  useEffect(() => {
    if (!user) return;
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, color, icon');
      if (!error && data) setCategories(data as unknown as Category[]);
      else setCategories([]);
    };
    fetchCategories();
  }, [user]);

  const { theme } = useAppTheme();

  const netAmount = totalIncome - totalExpense;

  return (
    <View style={[styles.container, { backgroundColor: theme.dark ? '#0A0A0A' : '#F5F7FA' }]}>
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <Animated.View style={[styles.header, { height: headerHeight }]}>
          <LinearGradient
            colors={theme.dark 
              ? ['#6366F1', '#8B5CF6', '#A855F7'] 
              : ['#6366F1', '#8B5CF6', '#A855F7']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          />
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Analytics</Text>
              <Text style={styles.subtitle}>Track your financial journey</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.statsContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.statCard, { 
            backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
            borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          }]}>
            <View style={styles.statIconContainer}>
              <LinearGradient
                colors={['#10B981', '#34D399']}
                style={styles.statIconGradient}
              >
                <Ionicons name="trending-up" size={24} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>฿{totalIncome.toFixed(0)}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Income</Text>
          </View>
          
          <View style={[styles.statCard, { 
            backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
            borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          }]}>
            <View style={styles.statIconContainer}>
              <LinearGradient
                colors={['#EF4444', '#F87171']}
                style={styles.statIconGradient}
              >
                <Ionicons name="trending-down" size={24} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>฿{totalExpense.toFixed(0)}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Expense</Text>
          </View>
          
          <View style={[styles.statCard, { 
            backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
            borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          }]}>
            <View style={styles.statIconContainer}>
              <LinearGradient
                colors={netAmount >= 0 ? ['#10B981', '#34D399'] : ['#EF4444', '#F87171']}
                style={styles.statIconGradient}
              >
                <Ionicons name="wallet" size={24} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={[styles.statValue, { color: netAmount >= 0 ? '#10B981' : '#EF4444' }]}>
              ฿{Math.abs(netAmount).toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Net {netAmount >= 0 ? 'Savings' : 'Deficit'}</Text>
          </View>
        </Animated.View>

        <View style={styles.periodContainer}>
          <Text style={[styles.periodTitle, { color: theme.colors.text }]}>Chart Period</Text>
          <View style={[styles.periodRow, { 
            backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          }]}>
            {[
              { key: 'daily', label: 'Day' },
              { key: 'weekly', label: 'Week' },
              { key: 'monthly', label: 'Month' },
              { key: 'yearly', label: 'Year' }
            ].map((periodOption) => (
              <TouchableOpacity
                key={periodOption.key}
                style={styles.periodCard}
                onPress={() => setView(periodOption.key as any)}
              >
                {view === periodOption.key ? (
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.periodCardGradient}
                  >
                    <Text style={styles.periodCardTextActive}>
                      {periodOption.label}
                    </Text>
                  </LinearGradient>
                ) : (
                  <Text style={[styles.periodCardText, { color: theme.colors.textSecondary }]}>
                    {periodOption.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[styles.chartCard, { 
            backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
            borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          }]}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Income vs Expense Trend</Text>
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <LinearGradient
                    colors={['#10B981', '#34D399']}
                    style={styles.legendDot}
                  />
                  <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Income</Text>
                </View>
                <View style={styles.legendItem}>
                  <LinearGradient
                    colors={['#EF4444', '#F87171']}
                    style={styles.legendDot}
                  />
                  <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Expense</Text>
                </View>
              </View>
            </View>
            {chartData ? (
              <LineChart
                data={{
                  labels: chartData.labels,
                  datasets: [
                    { 
                      data: chartData.incomeData, 
                      color: () => '#10B981', 
                      strokeWidth: 4 
                    },
                    { 
                      data: chartData.expenseData, 
                      color: () => '#EF4444', 
                      strokeWidth: 4 
                    },
                  ],
                }}
                width={Dimensions.get('window').width - 48}
                height={240}
                yAxisLabel="฿"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: theme.dark ? theme.colors.surface : '#ffffff',
                  backgroundGradientFrom: theme.dark ? theme.colors.surface : '#ffffff',
                  backgroundGradientTo: theme.dark ? theme.colors.surface : '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => theme.dark ? `rgba(255, 255, 255, ${Math.max(opacity * 0.9, 0.8)})` : `rgba(0, 0, 0, ${opacity * 0.6})`,
                  labelColor: (opacity = 1) => theme.dark ? `rgba(255, 255, 255, ${Math.max(opacity * 0.95, 0.9)})` : `rgba(0, 0, 0, ${opacity * 0.7})`,
                  style: { borderRadius: 16 },
                  propsForDots: { 
                    r: '6', 
                    strokeWidth: '3', 
                    stroke: theme.dark ? theme.colors.surface : '#fff',
                    fill: '#6366F1'
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: theme.dark ? 'rgba(255, 255, 255, 0.2)' : '#E0E0E0',
                    strokeWidth: 1,
                  },
                }}
                style={styles.chart}
                fromZero
                bezier
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="analytics" size={64} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Data Available</Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>Start adding transactions to see your analytics</Text>
              </View>
            )}
          </View>
        </Animated.View>

        <View style={styles.periodContainer}>
          <Text style={[styles.periodTitle, { color: theme.colors.text }]}>Breakdown Period</Text>
          <View style={[styles.periodRow, { 
            backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          }]}>
            {[
              { key: '2weeks', label: '2 Weeks' },
              { key: 'month', label: 'Month' },
              { key: 'custom', label: 'Custom' },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={styles.periodCard}
                onPress={() => setPeriod(key as any)}
              >
                {period === key ? (
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.periodCardGradient}
                  >
                    <Text style={styles.periodCardTextActive}>{label}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={[styles.periodCardText, { color: theme.colors.textSecondary }]}>{label}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {period === 'custom' && (
          <View style={styles.customDateRow}>
            <TouchableOpacity 
              onPress={() => setShowStartPicker(true)} 
              style={[styles.customDateBtn, { 
                backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              }]}
            >
              <Text style={[styles.customDateBtnText, { color: theme.colors.text }]}>Start: {customStart}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowEndPicker(true)} 
              style={[styles.customDateBtn, { 
                backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              }]}
            >
              <Text style={[styles.customDateBtnText, { color: theme.colors.text }]}>End: {customEnd}</Text>
            </TouchableOpacity>
          </View>
        )}

        {categories.length > 0 && filteredData.length > 0 && (
          <ExpenseChart
            data={filteredData.filter((t: any) => t.type === 'expense').map((t: any) => ({ ...t, category: categories.find((c: any) => c.id === t.category_id) })).filter((t: any) => t.category)}
            type="pie"
            title="Expense Breakdown"
          />
        )}

        {categories.length > 0 && filteredData.some((t: any) => t.type === 'income') && (
          <ExpenseChart
            data={filteredData.filter((t: any) => t.type === 'income')
              .map((t: any) => ({ ...t, category: categories.find((c: any) => c.id === t.category_id) }))
              .filter((t: any) => t.category)}
            type="pie"
            title="Income Breakdown"
          />
        )}

        {filteredData.some((t: any) => t.type === 'expense' && t.importance) && (
          <ExpenseChart
            data={filteredData.filter((t: any) => t.type === 'expense').map((t: any) => ({ ...t, category: categories.find((c: any) => c.id === t.category_id) })).filter((t: any) => t.category)}
            type="bar"
            title="Expenses by Importance"
          />
        )}

        {showStartPicker && (
          <View style={styles.datePickerOverlay}>
            <View style={[styles.datePickerModal, { 
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.text 
            }]}>
              <View style={[styles.datePickerHeader, { borderBottomColor: theme.colors.border }]}>
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
                style={[styles.datePicker, { backgroundColor: theme.colors.surface }]}
              />
            </View>
          </View>
        )}
        {showEndPicker && (
          <View style={styles.datePickerOverlay}>
            <View style={[styles.datePickerModal, { 
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.text 
            }]}>
              <View style={[styles.datePickerHeader, { borderBottomColor: theme.colors.border }]}>
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
                style={[styles.datePicker, { backgroundColor: theme.colors.surface }]}
              />
            </View>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    overflow: 'hidden',
    marginBottom: 20,
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  periodContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  periodRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
  },
  periodCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 40,
  },
  periodCardActive: {
  },
  periodCardGradient: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 40,
  },
  periodCardText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  periodCardTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  customDateRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  customDateBtn: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
  },
  customDateBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 250,
  },
  chartCard: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  chartSubtitle: {
    fontSize: 14,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
    marginLeft: 20,
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
    borderRadius: 24,
    margin: 20,
    padding: 20,
    minWidth: Dimensions.get('window').width * 0.8,
    maxWidth: Dimensions.get('window').width * 0.9,
    elevation: 8,
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
  },
});