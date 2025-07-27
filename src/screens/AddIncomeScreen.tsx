import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, FlatList, ScrollView, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
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

const getCategoryIcon = (categoryName: string) => {
  const iconMap: { [key: string]: string } = {
    'Salary': 'briefcase',
    'Freelance': 'laptop',
    'Gift': 'gift',
    'Investment': 'trending-up',
    'Business': 'storefront',
    'Bonus': 'star',
    'Other': 'ellipsis-horizontal',
  };
  return iconMap[categoryName] || 'cash';
};

export const AddIncomeScreen = ({ user }: { user: User }) => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { theme } = useAppTheme();
  const { selectedYear } = useDate();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    const fetchIncomeCategories = async () => {
      setLoadingCategories(true);
      try {
        const { data: fetchedCategories, error } = await supabase
          .from('categories')
          .select('id, name, color, icon, type')
          .eq('type', 'income');

        if (error) {
          setCategories([]);
          setSelectedCategoryId('');
        } else {
          const categories = fetchedCategories?.sort((a, b) => {
            if (a.name === 'Salary') return -1;
            if (b.name === 'Salary') return 1;
            return a.name.localeCompare(b.name);
          }) || [];
          
          setCategories(categories as unknown as Category[]);
          setSelectedCategoryId(categories[0]?.id || '');
        }
      } catch (error) {
        setCategories([]);
        setSelectedCategoryId('');
      }
      setLoadingCategories(false);
    };
    
    if (user?.id) fetchIncomeCategories();
  }, [user]);

  useEffect(() => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(selectedYear, currentDate.getMonth(), currentDate.getDate());
    if (currentDate.getFullYear() !== selectedYear) {
      setSelectedDate(newDate);
    }
  }, [selectedYear, selectedDate]);

  const handleAddIncome = async () => {
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
      description: description || `${categories.find(cat => cat.id === selectedCategoryId)?.name} income`,
      transaction_date: selectedDate.getFullYear() + '-' + 
        String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(selectedDate.getDate()).padStart(2, '0'),
      type: 'income',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Income added!');
      setAmount('');
      setDescription('');
      setSelectedDate(new Date());
      if (categories.length > 0) setSelectedCategoryId(categories[0].id);
      setTimeout(() => {
        navigation.navigate('Home');
      }, 300);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Add Income</Text>
        </View>

        <View style={styles.contentContainer}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Category</Text>
          {loadingCategories ? (
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading categories...</Text>
          ) : categories.length === 0 ? (
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>No categories found</Text>
          ) : (
            <>
              <View style={styles.quickCategoriesRow}>
                {categories.slice(0, 3).map(category => (
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
                      {category.name === 'Salary' ? '💰' : 
                       category.name === 'Freelance' ? '💻' : 
                       category.name === 'Gift' ? '🎁' : '💵'}
                    </Text>
                    <Text style={[
                      styles.categoryText,
                      { color: selectedCategoryId === category.id ? '#FFFFFF' : theme.colors.text }
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {categories.length > 3 && (
                <TouchableOpacity
                  style={[styles.moreButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Ionicons name="add" size={20} color={theme.colors.primary} />
                  <Text style={[styles.moreButtonText, { color: theme.colors.primary }]}>More Categories</Text>
                </TouchableOpacity>
              )}
              
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

        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Description</Text>
          <TextInput
            style={[styles.textInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            placeholder="Add a note (optional)"
            placeholderTextColor={theme.colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            onFocus={() => {
              setTimeout(() => {
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollToEnd({ animated: true });
                }
              }, 100);
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Date</Text>
          <DateSlider 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </View>

          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: theme.colors.primary }]} 
              onPress={handleAddIncome} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Add Income</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

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
              data={categories.slice(3)}
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // Extra padding for keyboard
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
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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