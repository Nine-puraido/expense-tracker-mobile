import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../contexts/ThemeContext';
import { useDate } from '../contexts/DateContext';

const { width } = Dimensions.get('window');

interface DateSliderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const DateSlider: React.FC<DateSliderProps> = ({ selectedDate, onDateChange }) => {
  const { theme } = useAppTheme();
  const { selectedYear } = useDate();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [dates, setDates] = useState<Date[]>([]);
  
  // Generate dates for the current month
  useEffect(() => {
    const generateDates = () => {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const dateArray: Date[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        dateArray.push(new Date(year, month, day));
      }
      
      setDates(dateArray);
    };
    
    generateDates();
  }, [selectedDate.getMonth(), selectedDate.getFullYear()]);
  
  // Scroll to selected date
  useEffect(() => {
    const selectedIndex = dates.findIndex(
      date => date.getDate() === selectedDate.getDate()
    );
    
    if (selectedIndex !== -1 && scrollViewRef.current) {
      const timeoutId = setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: selectedIndex * 70 - width / 2 + 35,
          animated: true,
        });
      }, 100);
      
      // Cleanup timeout to prevent memory leaks
      return () => clearTimeout(timeoutId);
    }
    
    // Return undefined explicitly if condition not met
    return undefined;
  }, [selectedDate, dates]);
  
  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };
  
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  const changeMonth = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    
    // Keep within the selected year bounds
    if (newDate.getFullYear() === selectedYear) {
      onDateChange(newDate);
    }
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };
  
  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={[styles.monthNav, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity 
          onPress={() => changeMonth(-1)}
          disabled={selectedDate.getMonth() === 0 && selectedDate.getFullYear() === selectedYear}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={
              selectedDate.getMonth() === 0 && selectedDate.getFullYear() === selectedYear
                ? theme.colors.border
                : theme.colors.text
            } 
          />
        </TouchableOpacity>
        
        <Text style={[styles.monthText, { color: theme.colors.text }]}>
          {getMonthName(selectedDate)}
        </Text>
        
        <TouchableOpacity 
          onPress={() => changeMonth(1)}
          disabled={selectedDate.getMonth() === 11 && selectedDate.getFullYear() === selectedYear}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={
              selectedDate.getMonth() === 11 && selectedDate.getFullYear() === selectedYear
                ? theme.colors.border
                : theme.colors.text
            } 
          />
        </TouchableOpacity>
      </View>
      
      {/* Date Slider */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dateItem,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              isSelected(date) && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              isToday(date) && !isSelected(date) && { borderColor: theme.colors.primary }
            ]}
            onPress={() => onDateChange(date)}
          >
            <Text style={[
              styles.dayName,
              { color: theme.colors.textSecondary },
              isSelected(date) && { color: '#FFFFFF' }
            ]}>
              {getDayName(date)}
            </Text>
            <Text style={[
              styles.dayNumber,
              { color: theme.colors.text },
              isSelected(date) && { color: '#FFFFFF' },
              isToday(date) && !isSelected(date) && { color: theme.colors.primary }
            ]}>
              {date.getDate()}
            </Text>
            {isToday(date) && (
              <View style={[
                styles.todayDot,
                { backgroundColor: isSelected(date) ? '#FFFFFF' : theme.colors.primary }
              ]} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  dateItem: {
    width: 60,
    height: 80,
    marginHorizontal: 5,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  dayName: {
    fontSize: 12,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '600',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});