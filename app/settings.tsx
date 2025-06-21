import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Divider, List, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFilters } from '../src/hooks/useFilters';
import { useRestaurants } from '../src/hooks/useRestaurants';
import { useTheme } from '../src/hooks/useTheme';
import { importDemoData } from '../src/models/PinDB';

export default function SettingsScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const addRestaurantList = useRestaurants(state => state.load);
  const { customTypes, typeCategories } = useFilters();

  const handleImportDemoData = () => {
    Alert.alert(
      '匯入示範資料',
      '這將會清空現有的所有資料，確定要匯入示範資料嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          style: 'destructive',
          onPress: () => {
            importDemoData(() => {
              addRestaurantList();
              Alert.alert('成功', '示範資料已匯入！');
            });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: '設定',
          headerShown: true,
          headerTitleAlign: 'center',
        }} 
      />
      <ScrollView style={styles.scrollView}>
        {/* 示範資料區塊 */}
        <Card style={styles.card}>
          <Card.Title title="示範資料" />
          <Card.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
              匯入包含美食和景點的示範資料，方便您體驗應用程式的功能。
            </Text>
            <Button 
              mode="contained" 
              onPress={handleImportDemoData}
              style={{ marginTop: 8 }}
            >
              匯入示範資料
            </Button>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        {/* 類型管理區塊 */}
        <Card style={styles.card}>
          <Card.Title title="類型管理" />
          <Card.Content>
            {customTypes.map((type) => (
              <List.Item
                key={type}
                title={type}
                description={`${typeCategories[type]?.length || 0} 個分類`}
                left={props => <List.Icon {...props} icon="tag" />}
              />
            ))}
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        {/* 關於區塊 */}
        <Card style={styles.card}>
          <Card.Title title="關於" />
          <Card.Content>
            <List.Item
              title="版本"
              description="1.0.0"
              left={props => <List.Icon {...props} icon="information" />}
            />
            <List.Item
              title="開發者"
              description="Yu Jui Yang"
              left={props => <List.Icon {...props} icon="account" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 8,
    elevation: 2,
  },
  divider: {
    marginVertical: 8,
  },
}); 