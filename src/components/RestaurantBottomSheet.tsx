import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurants } from '../hooks/useRestaurants';
import { Restaurant } from '../models/Restaurant';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import * as Linking from 'expo-linking';

type Props = {
  restaurant: Restaurant | null;
  onClose: () => void;
  onUpdate: (restaurant: Restaurant) => void;
};

export default function RestaurantBottomSheet({ restaurant, onClose, onUpdate }: Props) {
  const { list } = useRestaurants();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { palette } = useTheme();

  // 從列表中獲取最新的餐廳資料
  const currentRestaurant = restaurant 
    ? list.find(r => r.id === restaurant.id) || restaurant
    : null;

  const handleStatusChange = useCallback((status: 'want' | 'visited' | 'bad') => {
    if (!currentRestaurant) return;
    const updated = currentRestaurant.toggleStatus(status);
    onUpdate(updated);
  }, [currentRestaurant, onUpdate]);

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
        <View style={styles.headerRow}>
          <Text style={styles.title}>{currentRestaurant.name}</Text>
          <View style={styles.actionRow}>
            <Button
              icon="navigation"
              compact
              mode="text"
              onPress={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${currentRestaurant.lat},${currentRestaurant.lng}`;
                Linking.openURL(url);
              }}
              style={{ marginRight: 4 }}
            >導航</Button>
            <Button
              icon="pencil"
              compact
              mode="text"
              onPress={() => {
                onClose();
                router.push({ pathname: '/add-pin', params: { id: String(currentRestaurant.id) } });
              }}
            >編輯</Button>
          </View>
        </View>
        <Text>{currentRestaurant.address}</Text>
        <View style={styles.buttonContainer}>
          <View style={styles.row}>
            <View style={styles.buttonWrapper}>
              <Button
                mode="contained"
                buttonColor={currentRestaurant.status === 'want' ? palette.primary : '#e0e0e0'}
                textColor={currentRestaurant.status === 'want' ? '#fff' : '#666'}
                onPress={() => handleStatusChange('want')}
                style={styles.button}>
                想去
              </Button>
            </View>
            <View style={styles.buttonWrapper}>
              <Button
                mode="contained"
                buttonColor={currentRestaurant.status === 'visited' ? palette.primary : '#e0e0e0'}
                textColor={currentRestaurant.status === 'visited' ? '#fff' : '#666'}
                onPress={() => handleStatusChange('visited')}
                style={styles.button}>
                已去過
              </Button>
            </View>
            <View style={styles.buttonWrapper}>
              <Button
                mode="contained"
                buttonColor={currentRestaurant.status === 'bad' ? palette.primary : '#e0e0e0'}
                textColor={currentRestaurant.status === 'bad' ? '#fff' : '#666'}
                onPress={() => handleStatusChange('bad')}
                style={styles.button}>
                雷店
              </Button>
            </View>
          </View>
        </View>
        {/* 備註 */}
        {currentRestaurant.note ? (
          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>備註</Text>
            <Text style={styles.noteText}>{currentRestaurant.note}</Text>
          </View>
        ) : null}
        <Button textColor={palette.primary} onPress={onClose}>關閉</Button>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteContainer: {
    marginTop: 12,
  },
  noteLabel: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#555',
  },
  noteText: {
    color: '#333',
    lineHeight: 20,
  },
}); 