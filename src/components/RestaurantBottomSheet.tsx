import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurants } from '../hooks/useRestaurants';
import { Restaurant } from '../models/Restaurant';

type Props = {
  restaurant: Restaurant | null;
  onClose: () => void;
};

export default function RestaurantBottomSheet({ restaurant, onClose }: Props) {
  const { update, list } = useRestaurants();
  const insets = useSafeAreaInsets();

  // 從列表中獲取最新的餐廳資料
  const currentRestaurant = restaurant 
    ? list.find(r => r.id === restaurant.id) || restaurant
    : null;

  const handleStatusChange = useCallback((status: 'want' | 'visited' | 'bad') => {
    if (!currentRestaurant) return;
    const updated = currentRestaurant.toggleStatus(status);
    update(updated);
  }, [currentRestaurant, update]);

  if (!currentRestaurant) return null;

  return (
    <Portal>
      <Modal
        visible
        onDismiss={onClose}
        contentContainerStyle={[
          styles.sheet,
          { marginBottom: insets.bottom + 16 }
        ]}>
        <Text style={styles.title}>{currentRestaurant.name}</Text>
        <Text>{currentRestaurant.address}</Text>
        <View style={styles.buttonContainer}>
          <View style={styles.row}>
            <View style={styles.buttonWrapper}>
              <Button
                mode="contained"
                buttonColor={currentRestaurant.status === 'want' ? '#ff7f50' : '#e0e0e0'}
                textColor={currentRestaurant.status === 'want' ? '#fff' : '#666'}
                onPress={() => handleStatusChange('want')}
                style={styles.button}>
                想去
              </Button>
            </View>
            <View style={styles.buttonWrapper}>
              <Button
                mode="contained"
                buttonColor={currentRestaurant.status === 'visited' ? '#ff7f50' : '#e0e0e0'}
                textColor={currentRestaurant.status === 'visited' ? '#fff' : '#666'}
                onPress={() => handleStatusChange('visited')}
                style={styles.button}>
                已去過
              </Button>
            </View>
            <View style={styles.buttonWrapper}>
              <Button
                mode="contained"
                buttonColor={currentRestaurant.status === 'bad' ? '#ff7f50' : '#e0e0e0'}
                textColor={currentRestaurant.status === 'bad' ? '#fff' : '#666'}
                onPress={() => handleStatusChange('bad')}
                style={styles.button}>
                雷店
              </Button>
            </View>
          </View>
        </View>
        <Button onPress={onClose}>關閉</Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 12,
    borderRadius: 20,
    elevation: 8,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 8,
    color: '#333',
  },
  buttonContainer: {
    marginVertical: 12,
  },
  row: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    width: '100%',
  },
}); 