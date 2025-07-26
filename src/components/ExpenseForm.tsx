import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { IMPORTANCE_LEVELS, DEFAULT_CATEGORIES } from '../constants';
import { Category, ImportanceLevel } from '../types';

interface ExpenseFormProps {
  onSubmit: (data: {
    amount: number;
    categoryId: string;
    description: string;
    importance: ImportanceLevel;
    transactionDate: string;
  }) => void;
  categories: Category[];
  loading?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  onSubmit,
  categories,
  loading = false,
}) => {
  const { theme } = useAppTheme();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedImportance, setSelectedImportance] = useState<ImportanceLevel>('essential');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const handleSubmit = () => {
    if (!amount || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    onSubmit({
      amount: numAmount,
      categoryId: selectedCategory.id,
      description,
      importance: selectedImportance,
      transactionDate,
    });

    // Reset form
    setAmount('');
    setDescription('');
    setSelectedCategory(null);
    setSelectedImportance('essential');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    amountInput: {
      fontSize: 24,
      fontWeight: '600',
      textAlign: 'center',
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      borderWidth: 2,
      alignItems: 'center',
      minWidth: 100,
    },
    categoryItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    },
    categoryItemUnselected: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '500',
      marginTop: 4,
    },
    categoryTextSelected: {
      color: theme.colors.primary,
    },
    categoryTextUnselected: {
      color: theme.colors.text,
    },
    importanceContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    importanceItem: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 2,
      alignItems: 'center',
    },
    importanceItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    },
    importanceItemUnselected: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    importanceText: {
      fontSize: 14,
      fontWeight: '500',
    },
    importanceTextSelected: {
      color: theme.colors.primary,
    },
    importanceTextUnselected: {
      color: theme.colors.text,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 24,
    },
    submitButtonDisabled: {
      backgroundColor: theme.colors.border,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    submitButtonTextDisabled: {
      color: theme.colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <TextInput
            style={[styles.input, styles.amountInput]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            autoFocus
          />
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory?.id === category.id
                    ? styles.categoryItemSelected
                    : styles.categoryItemUnselected,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={24}
                  color={
                    selectedCategory?.id === category.id
                      ? theme.colors.primary
                      : category.color
                  }
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory?.id === category.id
                      ? styles.categoryTextSelected
                      : styles.categoryTextUnselected,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description (Optional)</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="What was this expense for?"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Importance Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Importance</Text>
          <View style={styles.importanceContainer}>
            {IMPORTANCE_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.importanceItem,
                  selectedImportance === level.value
                    ? styles.importanceItemSelected
                    : styles.importanceItemUnselected,
                ]}
                onPress={() => setSelectedImportance(level.value as ImportanceLevel)}
              >
                <Text
                  style={[
                    styles.importanceText,
                    selectedImportance === level.value
                      ? styles.importanceTextSelected
                      : styles.importanceTextUnselected,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!amount || !selectedCategory || loading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!amount || !selectedCategory || loading}
        >
          <Text
            style={[
              styles.submitButtonText,
              (!amount || !selectedCategory || loading) && styles.submitButtonTextDisabled,
            ]}
          >
            {loading ? 'Adding Expense...' : 'Add Expense'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}; 