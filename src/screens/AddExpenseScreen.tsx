import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../contexts/ThemeContext';
import { useDate } from '../contexts/DateContext';
import { User, Category } from '../types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DateSlider } from '../components/DateSlider';

type TabParamList = {
  Home: undefined;
  'Add Expense': undefined;
  'Add Income': undefined;
  Analytics: undefined;
  Profile: undefined;
};

const QUICK_CATEGORIES = ['Food', 'Groceries', 'Transportation'];

const getCategoryIcon = (categoryName: string) => {
  const iconMap: { [key: string]: string } = {
    'Food': 'restaurant',
    'Transportation': 'car',
    'Groceries': 'basket',
    'Grocery': 'basket',
    'Rent': 'home',
    'Bills': 'receipt',
    'Entertainment': 'game-controller',
    'Shopping': 'bag',
    'Healthcare': 'medical-outline',
    'Health': 'medical-outline',
    'Education': 'school',
    'Travel': 'airplane',
    'Fuel': 'car-sport',
    'Insurance': 'shield-checkmark',
    'Utilities': 'flash',
    'Clothing': 'shirt-outline',
    'Clothes': 'shirt-outline',
    'Electronics': 'laptop-outline',
    'Gadget': 'laptop-outline',
    'Books': 'library',
    'Gifts': 'gift',
    'Other': 'ellipsis-horizontal',
  };
  return iconMap[categoryName] || 'ellipsis-horizontal-circle';
};

export const AddExpenseScreen = ({ user }: { user: User }) => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { theme } = useAppTheme();
  const { selectedYear } = useDate();
  const amountInputRef = useRef<TextInput>(null);
  
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [importance, setImportance] = useState('essential');
  const [loading, setLoading] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    const fetchExpenseCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('type', 'expense')
          .order('name');

        if (error) {
          return;
        }

        if (data) {
          setCategories(data);
        }
      } catch (error) {
      }
    };

    fetchExpenseCategories();
  }, [user.id]);

  useFocusEffect(
    React.useCallback(() => {
      setAmount('');
      setSelectedCategoryId('');
      setSelectedCategoryName('');
      setDescription('');
      setSelectedDate(new Date());
      setImportance('essential');
      setShowAllCategories(false);
      
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }, [])
  );

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    setShowAllCategories(false);
  };

  const handleQuickAdd = async () => {
    if (!amount || !selectedCategoryId) {
      Alert.alert('Error', 'Please enter amount and select a category');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        category_id: selectedCategoryId,
        amount: Number(amount),
        description: description || `${selectedCategoryName} expense`,
        transaction_date: selectedDate.getFullYear() + '-' + 
          String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(selectedDate.getDate()).padStart(2, '0'),
        type: 'expense',
        importance,
      });

      if (error) throw error;

      Alert.alert('Success', 'Expense added!', [
        { text: 'Add Another', onPress: () => {
          setAmount('');
          setSelectedCategoryId('');
          setSelectedCategoryName('');
          setDescription('');
          setImportance('essential');
          setShowAllCategories(false);
          amountInputRef.current?.focus();
        }},
        { text: 'Done', onPress: () => {
          setTimeout(() => {
            navigation.navigate('Home');
          }, 100);
        }}
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const quickCategories = categories.filter(cat => QUICK_CATEGORIES.includes(cat.name));
  const otherCategories = categories.filter(cat => !QUICK_CATEGORIES.includes(cat.name));

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Quick Add Expense</Text>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.amountSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={[styles.currencySymbol, { color: theme.colors.text }]}>฿</Text>
              <TextInput
                ref={amountInputRef}
                style={[styles.amountInput, { color: theme.colors.text }]}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (amount && !isNaN(Number(amount))) {
                    amountInputRef.current?.blur();
                  }
                }}
              />
            </View>
          </View>

          <View style={styles.categorySection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Category</Text>
            
            <View style={styles.categoryGrid}>
              {quickCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    { 
                      backgroundColor: theme.colors.surface,
                      borderColor: selectedCategoryId === category.id ? theme.colors.primary : theme.colors.border,
                      borderWidth: selectedCategoryId === category.id ? 2 : 1,
                    }
                  ]}
                  onPress={() => handleCategorySelect(category.id, category.name)}
                >
                  <Ionicons 
                    name={getCategoryIcon(category.name) as any} 
                    size={24} 
                    color={selectedCategoryId === category.id ? theme.colors.primary : theme.colors.text} 
                  />
                  <Text 
                    style={[
                      styles.categoryName, 
                      { 
                        color: selectedCategoryId === category.id ? theme.colors.primary : theme.colors.text,
                        fontWeight: selectedCategoryId === category.id ? '600' : '500'
                      }
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={[
                  styles.categoryCard,
                  { 
                    backgroundColor: theme.colors.surface, 
                    borderColor: selectedCategoryId && !QUICK_CATEGORIES.includes(selectedCategoryName) ? theme.colors.primary : theme.colors.border,
                    borderWidth: selectedCategoryId && !QUICK_CATEGORIES.includes(selectedCategoryName) ? 2 : 1,
                  }
                ]}
                onPress={() => setShowAllCategories(!showAllCategories)}
              >
                {selectedCategoryId && !QUICK_CATEGORIES.includes(selectedCategoryName) ? (
                  <>
                    <Ionicons 
                      name={getCategoryIcon(selectedCategoryName) as any} 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                    <Text 
                      style={[
                        styles.categoryName, 
                        { 
                          color: theme.colors.primary,
                          fontWeight: '600'
                        }
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.8}
                    >
                      {selectedCategoryName}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons 
                      name="add-circle-outline" 
                      size={24} 
                      color={theme.colors.textSecondary} 
                    />
                    <Text style={[styles.categoryName, { color: theme.colors.textSecondary }]}>
                      More
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {showAllCategories && (
              <View style={[styles.additionalCategories, { backgroundColor: theme.colors.surface }]}>
                {otherCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.additionalCategoryItem,
                      { borderBottomColor: theme.colors.border }
                    ]}
                    onPress={() => handleCategorySelect(category.id, category.name)}
                  >
                    <Ionicons 
                      name={getCategoryIcon(category.name) as any} 
                      size={20} 
                      color={theme.colors.text} 
                    />
                    <Text style={[styles.additionalCategoryName, { color: theme.colors.text }]}>
                      {category.name}
                    </Text>
                    {selectedCategoryId === category.id && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

          </View>

          <TouchableOpacity
            style={[
              styles.quickAddButton,
              { 
                backgroundColor: amount && selectedCategoryId ? theme.colors.primary : theme.colors.border,
                opacity: amount && selectedCategoryId ? 1 : 0.5
              }
            ]}
            onPress={handleQuickAdd}
            disabled={!amount || !selectedCategoryId || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                <Text style={styles.quickAddButtonText}>Add Expense</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.formFields}>
            <View style={styles.twoColumnRow}>
              <View style={styles.leftColumn}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Priority</Text>
                <View style={styles.priorityContainer}>
                  {['essential', 'wants', 'extra'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.priorityChip,
                        { 
                          backgroundColor: importance === level ? theme.colors.primary : theme.colors.surface,
                          borderColor: theme.colors.border
                        }
                      ]}
                      onPress={() => setImportance(level)}
                    >
                      <Text style={[
                        styles.priorityChipText,
                        { color: importance === level ? '#FFFFFF' : theme.colors.text }
                      ]}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.rightColumn}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Note</Text>
                <TextInput
                  style={[styles.compactTextInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                  placeholder="Optional note"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            <View style={styles.dateSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Date</Text>
              <DateSlider 
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const { width } = Dimensions.get('window');
const categoryCardWidth = (width - 70) / 3; // 3 columns for better text fit

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      height: '100vh',
      overflow: 'hidden',
    }),
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  amountSection: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      overflow: 'hidden',
    }),
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: 'bold',
    minWidth: 120,
    textAlign: 'center',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
      border: 'none',
      backgroundColor: 'transparent',
      width: '100%',
      maxWidth: 200,
    }),
  },
  categorySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: -8,
  },
  categoryCard: {
    width: categoryCardWidth,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  categoryName: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },
  additionalCategories: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  additionalCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  additionalCategoryName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  quickAddButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  formFields: {
    marginTop: 10,
  },
  twoColumnRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  leftColumn: {
    flex: 1,
    marginRight: 10,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 10,
  },
  priorityContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  priorityChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  compactTextInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    height: 70,
    textAlignVertical: 'top',
  },
  dateSection: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
});