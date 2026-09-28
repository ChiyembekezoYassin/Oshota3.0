import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ImageBackground, FlatList, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Sidebar from '@/components/sidebar';
import HeaderWithSidebar from '@/components/HeaderWithSidebar';
import Footer from '@/components/footer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const backgroundImage = require('@/assets/images/budget.webp');

export default function Details() {
  const { name, amount: openingBalance, icon } = useLocalSearchParams();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const router = useRouter();

  const loadData = async () => {
    try {
      const savedTransactions = await AsyncStorage.getItem('transactions');
      if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions);
        setTransactions(parsedTransactions);

        // Filter transactions by category name
        const filtered = parsedTransactions.filter(
          (transaction) => transaction.category === name
        );
        setFilteredTransactions(filtered);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const deleteTransaction = async (transactionToDelete) => {
    // Filter out the deleted transaction
    const updatedTransactions = transactions.filter((transaction) => transaction !== transactionToDelete);
    const updatedFilteredTransactions = filteredTransactions.filter((transaction) => transaction !== transactionToDelete);

    setTransactions(updatedTransactions);
    setFilteredTransactions(updatedFilteredTransactions);

    // Update AsyncStorage with new transactions
    try {
      await AsyncStorage.setItem('transactions', JSON.stringify(updatedTransactions));

      // Update total expense and other relevant data
      const savedCategories = await AsyncStorage.getItem('categories');
      if (savedCategories) {
        const categories = JSON.parse(savedCategories);

        const updatedCategories = categories.map((cat) => {
          if (cat.name === transactionToDelete.category) {
            const updatedAmount =
              (parseFloat(cat.amount.replace('K', '').replace(',', '').trim()) || 0) -
              parseFloat(transactionToDelete.amount);

            return { ...cat, amount: `K ${updatedAmount.toFixed(2)}` };
          }
          return cat;
        });

        const newTotalExpense = updatedCategories.reduce((sum, cat) => {
          const amount = parseFloat(cat.amount.replace('K', '').replace(',', '').trim()) || 0;
          return sum + amount;
        }, 0);

        await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
        await AsyncStorage.setItem('totalExpense', JSON.stringify(newTotalExpense));
      }

      Alert.alert('Success', 'Transaction deleted successfully');
    } catch (error) {
      console.error('Error updating transactions:', error);
    }
  };

  useEffect(() => {
    loadData(); // Load transactions on component mount
  }, []);

  const calculateTotal = () => {
    const transactionsTotal = filteredTransactions.reduce((sum, transaction) => {
      // Ensure amount is a valid string and remove non-numeric characters
      const sanitizedAmount = typeof transaction.amount === 'string'
        ? transaction.amount
            .replace('K', '')        // Remove the 'K' symbol
            .replace(',', '')        // Remove commas
            .trim()                  // Trim any leading/trailing spaces
        : '0';  // Default to '0' if the amount is invalid (non-string)
  
      const numericAmount = parseFloat(sanitizedAmount) || 0;  // Parse to float, default to 0 if invalid
      return sum + numericAmount;
    }, 0);
  
    // Handle openingBalance similarly to avoid any potential issues
    const sanitizedOpeningBalance = typeof openingBalance === 'string'
      ? openingBalance.replace('K', '').replace(',', '').trim()
      : '0';
  
    return transactionsTotal + parseFloat(sanitizedOpeningBalance) || 0;  // Ensure we get a valid number
  };
  

  return (
    <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
      <View style={styles.container}>
        {isSidebarVisible && (
          <View style={styles.sidebarOverlay}>
            <Sidebar onClose={() => setIsSidebarVisible(false)} />
          </View>
        )}

        <HeaderWithSidebar onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)} />

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={25} color="#00796b" style={styles.icon} />
            <Text style={styles.title}>{name}</Text>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>Description</Text>
            <Text style={styles.headerCell}>Amount</Text>
            <Text style={styles.headerCell}>Date</Text>
          </View>

          {/* Transaction List */}
          <FlatList
            data={[...filteredTransactions]}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.transactionRow}>
                <Text style={styles.transactionCell}>{item.description}</Text>
                <Text style={styles.transactionCell}>{`K${item.amount}`}</Text>
                <Text style={styles.transactionCell}>{item.date}</Text>
                
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No transactions found for this category.</Text>
            }
          />

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>K{calculateTotal()}</Text>
          </View>

          {/* Update Button */}
          
          <TouchableOpacity style={styles.updateButton}>
            <Link href='/Transactions'>
            <Text style={styles.updateButtonText}>Update Transactions</Text>
            </Link>
            
          </TouchableOpacity>
        </View>

        <Footer />
      </View>
    </ImageBackground>
  );
}




const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: 'darkgreen',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '45%',
    height: Dimensions.get('window').height,
    backgroundColor: 'white',
    zIndex: 20,
  },
  updateButton: {
    backgroundColor: '#00796b',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 70,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
    marginBottom: 10,
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#555',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  transactionCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  openingBalanceText: {
    color: '#00796b',
    fontWeight: 'bold',
  },
  deleteButton: {
    paddingHorizontal: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00796b',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#aaa',
  },
});
