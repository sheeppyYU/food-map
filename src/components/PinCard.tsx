import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Menu, Text } from 'react-native-paper';
import { useRestaurants } from '../hooks/useRestaurants';
import { useTheme } from '../hooks/useTheme';
import { Pin, updatePinStatus } from '../models/PinDB';

type PinStatus = 'none' | 'want' | 'visited' | 'bad';

export default function PinCard({ pin }: { pin: Pin }) {
  const router = useRouter();
  const { palette } = useTheme();
  const [statusMenu, setStatusMenu] = useState(false);
  const [statusBtnWidth, setStatusBtnWidth] = useState(0);
  const addRestaurantList = useRestaurants(state => state.load);

  const getStatusText = (status: PinStatus) => {
    switch (status) {
      case 'want':
        return '想去';
      case 'visited':
        return '去過';
      case 'bad':
        return '雷店';
      default:
        return '不設定';
    }
  };

  const getStatusColor = (status: PinStatus) => {
    switch (status) {
      case 'want':
        return palette.accent;
      case 'visited':
        return '#4CAF50';
      case 'bad':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const handleStatusChange = (newStatus: PinStatus) => {
    if (pin.id === undefined) {
      console.error('Pin ID 未定義');
      return;
    }
    updatePinStatus(pin.id, newStatus, () => {
      // 更新成功後重新載入列表
      addRestaurantList();
    });
    setStatusMenu(false);
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* 標題列：店名 + 編輯按鈕 */}
        <View style={styles.titleRow}>
          <Text variant="titleMedium" style={styles.title}>{pin.name}</Text>
          <Button
            mode="text"
            onPress={() => router.push(`/add-pin?id=${pin.id}`)}
            textColor={palette.primary}
          >
            編輯
          </Button>
        </View>

        {/* 狀態選擇按鈕 */}
        <View style={styles.statusContainer}>
          <Menu
            visible={statusMenu}
            onDismiss={() => setStatusMenu(false)}
            anchor={
              <Button
                mode="outlined"
                onLayout={(e) => setStatusBtnWidth(e.nativeEvent.layout.width)}
                onPress={() => setStatusMenu(true)}
                style={[
                  styles.statusButton,
                  { borderColor: getStatusColor(pin.status as PinStatus) }
                ]}
                textColor={getStatusColor(pin.status as PinStatus)}
                icon={({ size, color }) => (
                  <MaterialIcons 
                    name="chevron-right" 
                    size={14} 
                    color={color} 
                    style={{ transform: [{ rotate: statusMenu ? '90deg' : '0deg' }] }}
                  />
                )}
              >
                {getStatusText(pin.status as PinStatus)}
              </Button>
            }
            contentStyle={{
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(60,60,67,0.2)',
              backgroundColor: '#fff',
              width: statusBtnWidth || 120,
            }}
          >
            <Menu.Item
              title="不設定"
              onPress={() => handleStatusChange('none')}
              style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(60,60,67,0.1)' }}
            />
            <Menu.Item
              title="想去"
              onPress={() => handleStatusChange('want')}
              style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(60,60,67,0.1)' }}
            />
            <Menu.Item
              title="去過"
              onPress={() => handleStatusChange('visited')}
              style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(60,60,67,0.1)' }}
            />
            <Menu.Item
              title="雷店"
              onPress={() => handleStatusChange('bad')}
            />
          </Menu>
        </View>

        {/* 地址 */}
        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={16} color={palette.primary} />
          <Text variant="bodyMedium" style={styles.address}>地址：{pin.address}</Text>
        </View>

        {/* 電話 */}
        {pin.phone && (
          <View style={[styles.infoRow, { marginTop: 8 }]}>
            <MaterialIcons name="phone" size={16} color={palette.primary} />
            <Text variant="bodyMedium" style={styles.infoText}>{pin.phone}</Text>
          </View>
        )}

        {/* 營業時間 */}
        {pin.businessHours && (
          <View style={[styles.infoRow, { marginTop: 8 }]}>
            <MaterialIcons name="access-time" size={16} color={palette.primary} />
            <Text variant="bodyMedium" style={styles.infoText}>{pin.businessHours}</Text>
          </View>
        )}

        {/* 分類標籤 */}
        <View style={styles.chipContainer}>
          <Chip
            mode="outlined"
            style={[
              styles.typeChip,
              { borderColor: palette.primary }
            ]}
            textStyle={{ color: palette.primary }}
          >
            {pin.type}
          </Chip>
          <Chip
            mode="outlined"
            style={[
              styles.categoryChip,
              { borderColor: palette.accent }
            ]}
            textStyle={{ color: palette.accent }}
          >
            {pin.category}
          </Chip>
        </View>

        {/* 備註 */}
        {pin.note && (
          <Text variant="bodySmall" style={styles.note}>
            {pin.note}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusButton: {
    borderRadius: 8,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  address: {
    flex: 1,
    marginLeft: 4,
  },
  infoText: {
    flex: 1,
    marginLeft: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 4,
  },
  typeChip: {
    marginRight: 8,
    borderRadius: 12,
  },
  categoryChip: {
    borderRadius: 12,
  },
  note: {
    marginTop: 8,
    color: '#666',
    fontStyle: 'italic',
  },
}); 