import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { CHART_COLORS, IMPORTANCE_LEVELS } from '../constants';
import { TransactionWithCategory, AnalyticsData } from '../types';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface ExpenseChartProps {
  data: TransactionWithCategory[];
  type: 'pie' | 'bar' | 'line';
  title: string;
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ data, type, title }) => {
  const { theme } = useAppTheme();

  // Process data for charts
  const processData = () => {
    const categoryTotals: { [key: string]: number } = {};
    if (type === 'bar' || type === 'line') {
      data.forEach((transaction) => {
        if (transaction.type === 'expense') {
          const categoryName = transaction.category?.name;
          if (!categoryName) return;
          categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + transaction.amount;
        }
      });
    } else {
      // For pie, use all data (expense or income)
      data.forEach((transaction) => {
        const categoryName = transaction.category?.name;
        if (!categoryName) return;
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + transaction.amount;
      });
    }
    return Object.entries(categoryTotals).map(([name, amount], index) => ({
      x: name,
      y: amount,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  };

  const chartData = processData();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    noDataText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginVertical: 40,
    },
    chartPlaceholder: {
      height: 300,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 16,
    },
    chartPlaceholderText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (chartData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.noDataText}>No expense data available</Text>
      </View>
    );
  }

  // For now, show a placeholder instead of Victory charts to avoid import issues
  const renderChart = () => {
    if (type === 'pie') {
      return (
        <>
          <View style={{ alignItems: 'center' }}>
            <PieChart
              data={chartData.map((item, i) => ({
                name: item.x,
                amount: item.y,
                color: item.fill,
                legendFontColor: '#333',
                legendFontSize: 12,
              }))}
              width={Math.min(width - 48, 280)}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                color: (opacity = 1) => theme.dark ? `rgba(255,255,255,${opacity * 0.8})` : `rgba(0,0,0,${opacity})`,
                labelColor: (opacity = 1) => theme.dark ? `rgba(255,255,255,${opacity * 0.9})` : `rgba(0,0,0,${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="62"
              absolute
              hasLegend={false}
              style={{ alignSelf: 'center' }}
            />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, justifyContent: 'flex-start' }}>
            {chartData.map((item, i) => (
              <View key={item.x} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 18, marginBottom: 10, maxWidth: 180 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.fill, marginRight: 8 }} />
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }} numberOfLines={1} ellipsizeMode="tail">{item.x}</Text>
                </View>
                <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600', marginLeft: 4, flexShrink: 0 }}>฿{item.y}</Text>
              </View>
            ))}
          </View>
        </>
      );
    } else if (type === 'bar') {
      // Group by importance
      const importanceData = IMPORTANCE_LEVELS.map(level => {
        const total = data.filter(t => t.type === 'expense' && t.importance === level.value).reduce((sum, t) => sum + t.amount, 0);
        return { ...level, total };
      }).filter(item => item.total > 0);
      return (
        <BarChart
          data={{
            labels: importanceData.map(item => item.label),
            datasets: [
              {
                data: importanceData.map(item => item.total),
                colors: importanceData.map(item => () => item.color),
              },
            ],
          }}
          width={width - 48}
          height={220}
          yAxisLabel="฿"
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => theme.dark ? `rgba(255,255,255,${opacity * 0.8})` : `rgba(0,0,0,${opacity})`,
            labelColor: (opacity = 1) => theme.dark ? `rgba(255,255,255,${opacity * 0.9})` : `rgba(0,0,0,${opacity})`,
            style: { borderRadius: 16 },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: theme.dark ? 'rgba(255,255,255,0.1)' : '#E0E0E0',
              strokeWidth: 1,
            },
          }}
          style={{ marginVertical: 8, borderRadius: 16, alignSelf: 'center', marginLeft: 16 }}
          fromZero
          showBarTops
          withInnerLines
          segments={4}
        />
      );
    } else if (type === 'line') {
      return (
        <LineChart
          data={{
            labels: chartData.map(item => item.x),
            datasets: [
              {
                data: chartData.map(item => item.y),
                color: () => CHART_COLORS[0],
                strokeWidth: 3,
              },
            ],
          }}
          width={width - 48}
          height={220}
          yAxisLabel="฿"
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#fff',
              fill: CHART_COLORS[0],
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: '#E0E0E0',
              strokeWidth: 1,
            },
          }}
          style={{ marginVertical: 8, borderRadius: 16, alignSelf: 'center' }}
          fromZero
          bezier
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {renderChart()}
    </View>
  );
};

// Monthly trend chart component
interface MonthlyTrendChartProps {
  data: AnalyticsData;
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ data }) => {
  const { theme } = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    chartPlaceholder: {
      height: 300,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 16,
    },
    chartPlaceholderText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Trend</Text>
      <View style={styles.chartPlaceholder}>
        <Text style={styles.chartPlaceholderText}>
          📊 Monthly Trend Chart
        </Text>
        <Text style={styles.chartPlaceholderText}>
          {data.monthlyData.length} months of data
        </Text>
      </View>
    </View>
  );
}; 