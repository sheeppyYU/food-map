import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Menu, Modal, Portal, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurants } from '../hooks/useRestaurants';
import { useTheme } from '../hooks/useTheme';
import { Restaurant } from '../models/Restaurant';
import {
  ResponsiveSizes,
  responsiveLineHeight,
  responsiveModalPadding,
  responsiveModalWidth
} from '../utils/responsive';

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
  const [statusMenu, setStatusMenu] = useState(false);
  const [statusBtnWidth, setStatusBtnWidth] = useState(0);
  

  // 從列表中獲取最新的餐廳資料
  const currentRestaurant = restaurant 
    ? list.find(r => r.id === restaurant.id) || restaurant
    : null;

  const handleStatusChange = useCallback((status: 'want' | 'visited' | 'bad') => {
    if (!currentRestaurant) return;
    // 如果點擊當前狀態，則切換為 'want'
    const newStatus = currentRestaurant.status === status ? 'want' : status;
    const updated = new Restaurant(
      currentRestaurant.id,
      currentRestaurant.name,
      currentRestaurant.county,
      currentRestaurant.categories,
      currentRestaurant.lat,
      currentRestaurant.lng,
      currentRestaurant.priceLevel,
      currentRestaurant.address,
      currentRestaurant.type,
      currentRestaurant.note,
      newStatus,
      currentRestaurant.createdAt,
      currentRestaurant.phone,
      currentRestaurant.businessHours,
    );
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
          { 
            marginBottom: insets.bottom + ResponsiveSizes.spacing.xlarge,
            width: responsiveModalWidth(),
            padding: responsiveModalPadding(),
          }
        ]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{currentRestaurant.name}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.buttonScrollContainer}
            style={styles.buttonScrollView}
          >
            <Button
              icon="navigation"
              compact
              mode="text"
              onPress={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${currentRestaurant.lat},${currentRestaurant.lng}`;
                Linking.openURL(url);
              }}
              style={styles.actionButton}
              labelStyle={styles.actionButtonLabel}
            >導航</Button>
            <Button
              icon="pencil"
              compact
              mode="text"
              onPress={() => {
                onClose();
                router.push({ pathname: '/add-pin', params: { id: String(currentRestaurant.id) } });
              }}
              style={styles.actionButton}
              labelStyle={styles.actionButtonLabel}
            >編輯</Button>
          </ScrollView>
        </View>
        <View style={styles.statusContainerRow}>
          <Menu
            visible={statusMenu}
            onDismiss={() => setStatusMenu(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setStatusMenu(true)}
                onLayout={(e) => setStatusBtnWidth(e.nativeEvent.layout.width)}
                style={[styles.statusButton, { borderColor: palette.primary }]}
                textColor={palette.primary}
                compact
                labelStyle={styles.statusButtonLabel}
              >
                {(() => {
                  switch (currentRestaurant.status) {
                    case 'want':
                      return '想去';
                    case 'visited':
                      return '已去過';
                    case 'bad':
                      return '雷店';
                    default:
                      return '不設定';
                  }
                })()}
              </Button>
            }
            contentStyle={{ 
              width: Math.max(statusBtnWidth, ResponsiveSizes.button.minWidth.medium), 
              marginTop: ResponsiveSizes.spacing.small 
            }}
          >
            <Menu.Item
              title="不設定"
              onPress={() => {
                handleStatusChange('want');
                setStatusMenu(false);
              }}
              style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(60,60,67,0.1)' }}
            />
            <Menu.Item
              title="想去"
              onPress={() => {
                handleStatusChange('want');
                setStatusMenu(false);
              }}
              style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(60,60,67,0.1)' }}
            />
            <Menu.Item
              title="已去過"
              onPress={() => {
                handleStatusChange('visited');
                setStatusMenu(false);
              }}
              style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(60,60,67,0.1)' }}
            />
            <Menu.Item
              title="雷店"
              onPress={() => {
                handleStatusChange('bad');
                setStatusMenu(false);
              }}
            />
          </Menu>
        </View>
        <Text style={[styles.infoText, { marginTop: 8,marginBottom: 8 }]}>{`地址：${currentRestaurant.address}`}</Text>
        {currentRestaurant.phone && currentRestaurant.phone.trim() !== '' && (
          <Text style={[styles.infoText, {flexWrap: 'wrap'}]} selectable>{`電話：${currentRestaurant.phone}`}</Text>
        )}
        {/* 營業時間：加斷行，禮拜一~日每行一行 */}
        {currentRestaurant.businessHours && currentRestaurant.businessHours.trim() !== '' && (
          <View style={{ marginTop: ResponsiveSizes.spacing.tiny, marginBottom: ResponsiveSizes.spacing.tiny }}>
            <Text style={[styles.infoText, { marginTop: 8, flexWrap: 'wrap' }]}>營業時間：</Text>
            {currentRestaurant.businessHours.split('\n').map((line, idx) => (
              <Text style={[styles.infoText]} key={idx}>{line}</Text>
            ))}
          </View>
        )}
        {/* 備註 */}
        {currentRestaurant.note ? (
          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>備註</Text>
            <Text style={styles.noteText}>{currentRestaurant.note}</Text>
          </View>
        ) : null}
        <Button 
          textColor={palette.primary} 
          onPress={onClose}
          labelStyle={{ fontSize: ResponsiveSizes.font.medium }}
        >關閉</Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#fff',
    margin: ResponsiveSizes.spacing.large,
    borderRadius: ResponsiveSizes.borderRadius.xlarge,
    elevation: 8,
    alignSelf: 'center',
  },
  title: { 
    fontSize: ResponsiveSizes.font.title,
    fontWeight: '600', 
    marginBottom: ResponsiveSizes.spacing.medium,
    color: '#333',
    lineHeight: responsiveLineHeight(ResponsiveSizes.font.title),
    flex: 1,
    marginRight: ResponsiveSizes.spacing.medium,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ResponsiveSizes.spacing.small,
  },
  buttonScrollView: {
    flexShrink: 1,
    maxWidth: '50%',
  },
  buttonScrollContainer: {
    alignItems: 'center',
    paddingHorizontal: ResponsiveSizes.spacing.tiny,
  },
  actionButton: {
    marginHorizontal: ResponsiveSizes.spacing.tiny,
    paddingHorizontal: ResponsiveSizes.spacing.medium,
    minWidth: ResponsiveSizes.button.minWidth.small,
    height: ResponsiveSizes.button.height.medium,
  },
  actionButtonLabel: {
    fontSize: ResponsiveSizes.font.small,
    fontWeight: '500',
  },
  statusButton: {
    borderRadius: ResponsiveSizes.borderRadius.medium,
    borderWidth: 1,
    marginHorizontal: ResponsiveSizes.spacing.tiny,
    paddingHorizontal: ResponsiveSizes.spacing.medium,
    minWidth: ResponsiveSizes.button.minWidth.medium,
    height: ResponsiveSizes.button.height.medium,
  },
  statusButtonLabel: {
    fontSize: ResponsiveSizes.font.small,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 0,
  },
  noteContainer: {
    marginTop: ResponsiveSizes.spacing.large,
  },
  noteLabel: {
    fontWeight: '600',
    marginBottom: ResponsiveSizes.spacing.medium,
    color: '#555',
    fontSize: ResponsiveSizes.font.medium,
  },
  noteText: {
    color: '#333',
    lineHeight: responsiveLineHeight(ResponsiveSizes.font.medium),
    fontSize: ResponsiveSizes.font.medium,
  },
  infoText: {
    fontSize: ResponsiveSizes.font.large,
    color: '#222',
    marginTop: ResponsiveSizes.spacing.tiny,
    marginBottom: ResponsiveSizes.spacing.tiny,
    lineHeight: responsiveLineHeight(ResponsiveSizes.font.large),
  },
  statusContainerRow: {
    marginTop: ResponsiveSizes.spacing.tiny,
    marginBottom: ResponsiveSizes.spacing.medium,
    alignSelf: 'flex-start',
    width: '100%',
  },
}); 