import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Dialog, Menu, TextInput as PaperInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFilters } from '../src/hooks/useFilters';
import { useRestaurants } from '../src/hooks/useRestaurants';
import { useTheme } from '../src/hooks/useTheme';
import { getAllPins, initDB, insertPin, Pin, updatePin } from '../src/models/PinDB';

// 這裡你可以定義你的 Pin 資料結構，與 PinDB.ts 中的 Pin Type 保持一致
type PinStatus = 'none' | 'want' | 'visited' | 'bad';

export default function AddPinScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ? parseInt(String(params.id), 10) : null;
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<PinStatus>('none');
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectCategoryDialog, setSelectCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [catMenu, setCatMenu] = useState(false);
  const [statusMenu, setStatusMenu] = useState(false);
  const [catBtnWidth, setCatBtnWidth] = useState(0);
  const [statusBtnWidth, setStatusBtnWidth] = useState(0);
  const [typeMenu, setTypeMenu] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(!!editingId);
  const [catSearch, setCatSearch] = useState('');
  const { palette } = useTheme();

  const router = useRouter();
  const addRestaurantList = useRestaurants(state => state.load);
  const { list } = useRestaurants();
  const { customTypes, addCustomType, typeCategories, addCategoryToType } = useFilters();
  const [mainType, setMainType] = useState<string>(customTypes[0] || '美食');

  const menuStyle = {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(60,60,67,0.2)',
    backgroundColor: '#fff',
    paddingVertical: 0,
  };

  // 動態生成類型列表
  const availableTypes = React.useMemo(() => {
    // 從實際的 Pin 資料中獲取所有類型
    const typesFromPins = Array.from(new Set(list.map(r => r.type)));
    // 合併自定義類型和實際使用的類型
    return Array.from(new Set([...typesFromPins, ...customTypes]));
  }, [list, customTypes]);

  // 根據選擇的類型獲取可用的分類列表
  const availableCategories = React.useMemo(() => {
    if (!mainType) return [];
    // 從實際的 Pin 資料中獲取該類型的所有分類
    const categoriesFromPins = Array.from(new Set(
      list
        .filter(r => r.type === mainType)
        .flatMap(r => r.categories)
    ));
    // 合併 typeCategories 中定義的分類
    return Array.from(new Set([
      ...categoriesFromPins,
      ...(typeCategories[mainType] || [])
    ]));
  }, [mainType, list, typeCategories]);

  // 過濾搜尋結果
  const filteredCategories = React.useMemo(() => {
    return catSearch 
      ? availableCategories.filter(c => c.includes(catSearch))
      : availableCategories;
  }, [availableCategories, catSearch]);

  // 初始化 mainType
  useEffect(() => {
    if (availableTypes.length > 0 && !mainType) {
      setMainType(availableTypes[0]);
    }
  }, [availableTypes]);

  // 載入現有分類
  useEffect(() => {
    initDB();
  }, []);

  // 若為編輯，載入既有資料
  useEffect(() => {
    if (editingId !== null) {
      initDB();
      getAllPins((pins) => {
        const target = pins.find((p) => p.id === editingId);
        if (target) {
          setName(target.name);
          setAddress(target.address);
          setCategory(target.category);
          setStatus(target.status as PinStatus);
          setNote(target.note ?? '');
          setPhone(target.phone ?? '');
          setBusinessHours(target.businessHours ?? '');
          setMainType(target.type);
        }
      });
    }
  }, [editingId]);

  const handleSavePin = async () => {
    if (!name || !address || !category) {
      Alert.alert('錯誤', '店名、地址、分類為必填欄位！');
      return;
    }

    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const geocoded = await Location.geocodeAsync(address);
      if (geocoded.length) {
        lat = geocoded[0].latitude;
        lng = geocoded[0].longitude;
      }
    } catch (e) {
      // 忽略地理編碼失敗
    }

    // 若地址缺少「市/縣」，嘗試透過逆地理編碼補上
    let finalAddress = address;
    if (!/[縣市]/.test(address) && lat && lng) {
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geo.length) {
          const { region, subregion, city: cityName, district } = geo[0] as any;
          const pick = [region, subregion, cityName, district].find(
            (x) => typeof x === 'string' && /[縣市]$/.test(x as string),
          );
          if (pick) {
            finalAddress = `${pick}${address}`;
          }
        }
      } catch {}
    }

    const newPin: Pin = {
      name,
      address: finalAddress,
      category,
      type: mainType,
      status,
      note,
      phone,
      businessHours,
      lat: lat ?? 25.033,
      lng: lng ?? 121.5654,
    };
    initDB();
    if (isEditing && editingId !== null) {
      updatePin(editingId, newPin, () => {
        console.log('Pin 已更新！', newPin);
        addRestaurantList();
        Alert.alert('成功', 'Pin 已更新！');
        setTimeout(() => {
          router.back();
        }, 300);
      });
    } else {
      insertPin(newPin, () => {
        console.log('Pin 已儲存到資料庫！', newPin);
        addRestaurantList();
        Alert.alert('成功', 'Pin 已儲存！');
        setTimeout(() => {
          router.back();
        }, 300);
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: isEditing ? '編輯 Pin' : '新增 Pin',
          headerShown: true,
          headerTitleAlign: 'center',
          headerLeft: () => (
            <Button 
              icon="arrow-left"
              textColor={palette.primary}
              onPress={() => router.back()}
            >
              返回
            </Button>
          ),
        }} 
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 80}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 狀態 + 分類 區塊 (置頂) */}
          <View style={styles.cardContainer}>
            <View style={styles.dropdownRow}>
              {/* 上層類型 */}
              <View style={{ flex: 1, marginRight: 4 }}>
                <Text style={styles.credentialLabel}>類型</Text>
                <Menu
                  visible={typeMenu}
                  onDismiss={()=>setTypeMenu(false)}
                  anchor={
                    <Pressable style={styles.dropdownBtn} onPress={()=>setTypeMenu(prev=>!prev)}>
                      <Text style={styles.dropdownText}>{mainType}</Text>
                      <MaterialIcons name="chevron-right" size={14} color={palette.primary} style={{ transform:[{rotate:typeMenu?'90deg':'0deg'}] }}/>
                    </Pressable>
                  }
                  contentStyle={{ ...menuStyle, width: 120 }}
                >
                  {availableTypes.map(t=>(
                    <Menu.Item key={t} title={t} onPress={()=>{
                      setMainType(t);
                      setCategory('');
                      setTypeMenu(false);
                    }} />
                  ))}
                  <Menu.Item title="＋ 新增類型" onPress={()=>{
                    setTypeMenu(false);
                    if(Platform.OS==='ios'){
                      Alert.prompt('新增類型','請輸入',txt=>{
                        if(txt){
                          addCustomType(txt); 
                          setMainType(txt);
                          setCategory('');
                        }
                      });
                    }else{
                      const name=prompt('輸入類型名稱'); 
                      if(name){
                        addCustomType(name); 
                        setMainType(name);
                        setCategory('');
                      }
                    }
                  }} />
                </Menu>
              </View>

              {/* 狀態 */}
              <View style={{ flex: 1, marginLeft: 4 }}>
                <Text style={styles.credentialLabel}>狀態</Text>
                <Menu
                  visible={statusMenu}
                  onDismiss={() => setStatusMenu(false)}
                  anchor={
                    <Pressable
                      onLayout={(e)=>setStatusBtnWidth(e.nativeEvent.layout.width)}
                      style={styles.dropdownBtn}
                      onPress={() => setStatusMenu(prev=>!prev)}
                    >
                      <Text style={styles.dropdownText}>
                        {(() => {
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
                        })()}
                      </Text>
                      <MaterialIcons name="chevron-right" size={14} color={palette.primary} style={{ transform: [{ rotate: statusMenu ? '90deg' : '0deg' }] }}/>
                    </Pressable>
                  }
                  contentStyle={{ ...menuStyle, width: statusBtnWidth || 180 }}
                  anchorPosition="bottom"
                >
                  <Menu.Item
                    title="不設定"
                    onPress={() => {
                      setStatus('none');
                      setStatusMenu(false);
                    }}
                    style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(60,60,67,0.1)' }}
                  />
                  <Menu.Item
                    title="想去"
                    onPress={() => {
                      setStatus('want');
                      setStatusMenu(false);
                    }}
                    style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(60,60,67,0.1)' }}
                  />
                  <Menu.Item
                    title="去過"
                    onPress={() => {
                      setStatus('visited');
                      setStatusMenu(false);
                    }}
                    style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(60,60,67,0.1)' }}
                  />
                  <Menu.Item title="雷店" onPress={() => {
                    setStatus('bad');
                    setStatusMenu(false);
                  }} />
                </Menu>
              </View>

              {/* 分類 */}
              <View style={{ flex: 1, marginLeft: 4 }}>
                <Text style={styles.credentialLabel}>分類</Text>
                <Pressable
                  onLayout={(e) => setCatBtnWidth(e.nativeEvent.layout.width)}
                  style={styles.dropdownBtn}
                  onPress={() => setSelectCategoryDialog(true)}
                >
                  <Text style={styles.dropdownText}>{category || '選擇分類'}</Text>
                  <MaterialIcons name="chevron-right" size={14} color={palette.primary} style={{ transform: [{ rotate: selectCategoryDialog ? '90deg' : '0deg' }] }}/>
                </Pressable>
              </View>
            </View>
          </View>

          {/* 店名 + 地址 */}
          <View style={styles.cardContainer}>
            <Text style={styles.credentialLabel}>店名</Text>
            <PaperInput
              style={styles.inputField}
              placeholder="請輸入店名"
              value={name}
              onChangeText={setName}
              mode="outlined"
            />

            <Text style={[styles.credentialLabel, { marginTop: 12 }]}>地址</Text>
            <PaperInput
              style={styles.inputField}
              placeholder="請輸入地址"
              value={address}
              onChangeText={setAddress}
              mode="outlined"
            />
          </View>

          {/* 電話號碼 */}
          <View style={styles.cardContainer}>
            <Text style={styles.credentialLabel}>電話號碼</Text>
            <PaperInput
              style={styles.inputField}
              placeholder="請輸入電話號碼"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              mode="outlined"
            />
          </View>

          {/* 營業時間 */}
          <View style={styles.cardContainer}>
            <Text style={styles.credentialLabel}>營業時間</Text>
            <PaperInput
              style={[styles.inputField, styles.noteInput]}
              placeholder="請輸入營業時間"
              value={businessHours}
              onChangeText={setBusinessHours}
              multiline
              numberOfLines={3}
              mode="outlined"
            />
          </View>

          {/* 備註 */}
          <View style={styles.cardContainer}>
            <Text style={styles.credentialLabel}>備註</Text>
            <PaperInput
              style={[styles.inputField, styles.noteInput]}
              placeholder="可選填備註"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              mode="outlined"
            />
          </View>

          {/* 取消 / 儲存 按鈕列 */}
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={[styles.actionButton, styles.cancelButton]}
              labelStyle={{ color: '#FF3B30', fontWeight: '600' }}
            >
              取消
            </Button>

            <Button
              mode="contained"
              onPress={handleSavePin}
              style={[styles.actionButton, styles.saveButton, {backgroundColor: palette.primary}]}
              labelStyle={{ fontWeight: '600' }}
            >
              儲存 Pin
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 分類選擇 Dialog */}
      <Dialog visible={selectCategoryDialog} onDismiss={() => setSelectCategoryDialog(false)}>
        <Dialog.Title>選擇分類</Dialog.Title>
        <Dialog.ScrollArea style={{ maxHeight: 400 }}>
          <ScrollView>
            <PaperInput
              placeholder="搜尋分類"
              value={catSearch}
              onChangeText={setCatSearch}
              mode="outlined"
              style={{ marginBottom: 8 }}
            />
            {filteredCategories.map((c) => (
              <Button
                key={c}
                onPress={() => {
                  setCategory(c);
                  setSelectCategoryDialog(false);
                  setCatSearch('');
                }}
                style={{ justifyContent: 'flex-start' }}
              >{c}</Button>
            ))}
            <Button
              onPress={() => {
                setSelectCategoryDialog(false);
                setShowCategoryDialog(true);
              }}
              style={{ justifyContent: 'flex-start', marginTop: 8 }}
            >＋ 新增分類</Button>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={() => setSelectCategoryDialog(false)}>關閉</Button>
        </Dialog.Actions>
      </Dialog>

      {/* 新增分類 Dialog */}
      {showCategoryDialog && (
        <Dialog visible={showCategoryDialog} onDismiss={() => setShowCategoryDialog(false)}>
          <Dialog.Title>新增分類</Dialog.Title>
          <Dialog.Content>
            <PaperInput
              placeholder={`為「${mainType}」類型新增分類`}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCategoryDialog(false)}>取消</Button>
            <Button onPress={() => {
              if (newCategoryName.trim()) {
                addCategoryToType(mainType, newCategoryName.trim());
                setCategory(newCategoryName.trim());
              }
              setNewCategoryName('');
              setShowCategoryDialog(false);
            }}>新增</Button>
          </Dialog.Actions>
        </Dialog>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inputField: {
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  noteInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 10,
    height: Platform.OS === 'ios' ? 180 : 56,
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 56,
    width: '100%',
    fontSize: 16,
  },
  saveButtonOld: {
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dropdownBtn: {
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  cardContainer: {
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(60,60,67,0.1)',
    padding: 16,
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  credentialLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.8)',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  cancelButton: {
    marginRight: 8,
    borderColor: 'rgba(255,59,48,0.3)',
    backgroundColor: 'rgba(255,59,48,0.1)',
  },
  saveButton: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
  },
}); 