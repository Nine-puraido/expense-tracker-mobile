import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, FlatList, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
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

const IMPORTANCE = ['essential', 'wants', 'extra'];

const getCategoryIcon = (categoryName: string) => {
  const iconMap: { [key: string]: string } = {
    'Food': 'restaurant',
    'Transportation': 'car',
    'Groceries': 'basket',
    'Rent': 'home',
    'Bills': 'receipt',
    'Entertainment': 'game-controller',
    'Shopping': 'bag',
    'Healthcare': 'medical',
    'Education': 'school',
    'Travel': 'airplane',
    'Fuel': 'car-sport',
    'Insurance': 'shield-checkmark',
    'Utilities': 'flash',
    'Clothing': 'shirt',
    'Electronics': 'phone-portrait',
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
  
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [importance, setImportance] = useState(IMPORTANCE[0]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    const fetchExpenseCategories = async () => {
      setLoadingCategories(true);
      try {
        const { data: fetchedCategories, error } = await supabase
          .from('categories')
          .select('id, name, color, icon, type')
          .eq('type', 'expense');

        if (error) {
          console.error('Error fetching expense categories:', error);
          setCategories([]);
          setSelectedCategoryId('');
        } else {
          // Sort categories with Food first, then alphabetically
          const categories = fetchedCategories?.sort((a, b) => {
            if (a.name === 'Food') return -1;
            if (b.name === 'Food') return 1;
            return a.name.localeCompare(b.name);
          }) || [];
          
          setCategories(categories as unknown as Category[]);
          setSelectedCategoryId(categories[0]?.id || '');
        }
      } catch (error) {
        console.error('Error fetching expense categories:', error);
        setCategories([]);
        setSelectedCategoryId('');
      }
      setLoadingCategories(false);
    };
    
    if (user?.id) fetchExpenseCategories();
  }, [user]);

  // Update selected date when year changes
  useEffect(() => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(selectedYear, currentDate.getMonth(), currentDate.getDate());
    // Only update if the year is different
    if (currentDate.getFullYear() !== selectedYear) {
      setSelectedDate(newDate);
    }
  }, [selectedYear, selectedDate]);


  const handleAddExpense = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      category_id: selectedCategoryId,
      amount: Number(amount),
      description,
      transaction_date: selectedDate.toISOString().split('T')[0],
      type: 'expense',
      importance,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Expense added!');
      setAmount('');
      setDescription('');
      setSelectedDate(new Date());
      setImportance(IMPORTANCE[0]);
      if (categories.length > 0) setSelectedCategoryId(categories[0].id);
      navigation.navigate('Home');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Add Expense</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Amount</Text>
          <View style={[styles.inputContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>฿</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.colors.text }]}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        {/* Category Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Category</Text>
          {loadingCategories ? (
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading categories...</Text>
          ) : categories.length === 0 ? (
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>No categories found</Text>
          ) : (
            <>
              {/* Quick Categories */}
              <View style={styles.quickCategoriesRow}>
                {['Food', 'Transportation', 'Groceries'].map(categoryName => {
                  const category = categories.find(cat => cat.name === categoryName);
                  if (!category) return null;
                  
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.quickCategoryBtn,
                        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                        selectedCategoryId === category.id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                      ]}
                      onPress={() => setSelectedCategoryId(category.id)}
                    >
                      <Text style={styles.categoryEmoji}>
                        {categoryName === 'Food' ? '🍽️' : 
                         categoryName === 'Transportation' ? '🚗' : 
                         categoryName === 'Groceries' ? '🛒' : '📝'}
                      </Text>
                      <Text style={[
                        styles.categoryText,
                        { color: selectedCategoryId === category.id ? '#FFFFFF' : theme.colors.text }
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {/* More Categories Button */}
              <TouchableOpacity
                style={[styles.moreButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => setShowCategoryModal(true)}
              >
                <Ionicons name="add" size={20} color={theme.colors.primary} />
                <Text style={[styles.moreButtonText, { color: theme.colors.primary }]}>More Categories</Text>
              </TouchableOpacity>
              
              {/* Selected Category */}
              {selectedCategoryId && (
                <View style={[styles.selectedCategory, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <Text style={[styles.selectedCategoryText, { color: theme.colors.text }]}>
                    Selected: {categories.find(cat => cat.id === selectedCategoryId)?.name}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Priority Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Priority</Text>
          <View style={styles.priorityRow}>
            {IMPORTANCE.map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.priorityBtn,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  importance === level && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]}
                onPress={() => setImportance(level)}
              >
                <Text style={[
                  styles.priorityText,
                  { color: importance === level ? '#FFFFFF' : theme.colors.text }
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Date</Text>
          <DateSlider 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Description</Text>
          <TextInput
            style={[styles.textInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            placeholder="Add a note (optional)"
            placeholderTextColor={theme.colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary }]} 
        onPress={handleAddExpense} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name="add" size={28} color="#FFFFFF" />
        )}
      </TouchableOpacity>


      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.categoryModal, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <View />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={categories.filter(cat => !['Food', 'Transportation', 'Groceries'].includes(cat.name))}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    { borderBottomColor: theme.colors.border },
                    selectedCategoryId === item.id && { backgroundColor: theme.colors.primary + '20' }
                  ]}
                  onPress={() => {
                    setSelectedCategoryId(item.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={[styles.categoryIconContainer, { backgroundColor: item.color + '20' }]}>
                    <Ionicons 
                      name={getCategoryIcon(item.name) as any} 
                      size={20} 
                      color={item.color} 
                    />
                  </View>
                  <Text style={[styles.categoryItemText, { color: theme.colors.text }]}>
                    {item.name}
                  </Text>
                  {selectedCategoryId === item.id && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
  },
  quickCategoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickCategoryBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  selectedCategory: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6,
  },
  selectedCategoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  loadingText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  categoryModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  categoryItemText: {
    flex: 1,
    fontSize: 16,
  },
}); 