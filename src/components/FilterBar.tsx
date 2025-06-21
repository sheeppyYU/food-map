import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Platform, ScrollView, View } from 'react-native';
import { Button, Chip, Divider, Menu, TextInput } from 'react-native-paper';
import { useFilters } from '../hooks/useFilters';
import { useRestaurants } from '../hooks/useRestaurants';
import { useTheme } from '../hooks/useTheme';
import type { County } from '../models/Restaurant';

export default function FilterBar() {
  const { 
    county, 
    categories, 
    mainType, 
    customTypes, 
    typeCategories,
    setCounty, 
    setMainType, 
    addCustomType, 
    removeType, 
    toggleCategory, 
    clearCategories,
    addCategoryToType,
    removeCategoryFromType
  } = useFilters();
  
  const { palette } = useTheme();
  const [open, setOpen] = React.useState(false);
  const { list, load } = useRestaurants();
  const [search, setSearch] = React.useState('');

  // 動態生成類型列表：顯示 customTypes 中的類型 + 實際有 Pin 但還沒在 customTypes 中的類型
  const availableTypes = React.useMemo(() => {
    // 從實際的 Pin 資料中獲取所有類型
    const typesFromPins = Array.from(new Set(list.map(r => r.type)));
    // 合併自定義類型和實際使用的類型，但優先顯示 customTypes 中的順序
    const allTypes = [...customTypes];
    // 添加實際存在但不在 customTypes 中的類型
    typesFromPins.forEach(type => {
      if (!allTypes.includes(type)) {
        allTypes.push(type);
      }
    });
    return allTypes;
  }, [list, customTypes]);

  // 根據當前選擇的類型獲取對應的分類列表
  const availableCategories = React.useMemo(() => {
    if (!mainType) {
      // 如果沒有選擇類型，顯示所有分類
      return Array.from(new Set(list.flatMap(r => r.categories)));
    }
    // 返回當前類型下實際存在的分類
    return Array.from(new Set(
      list
        .filter(r => r.type === mainType)
        .flatMap(r => r.categories)
    ));
  }, [mainType, list]);

  // 過濾搜尋結果
  const filteredCategories = React.useMemo(() => {
    return search 
      ? availableCategories.filter(c => c.includes(search))
      : availableCategories;
  }, [availableCategories, search]);

  // 動態縣市
  const dynamicCounties = React.useMemo<County[]>(() => {
    const uniq = Array.from(new Set(list.map((r) => r.county))) as County[];
    return uniq;
  }, [list]);

  // 處理類型刪除
  const handleRemoveType = (typeToRemove: string) => {
    if (customTypes.length <= 1) {
      Alert.alert('提示', '至少保留一個類型');
      return;
    }

    const otherTypes = customTypes.filter(t => t !== typeToRemove);
    const pinsWithThisType = list.filter(pin => pin.type === typeToRemove);
    
    if (pinsWithThisType.length === 0) {
      // 沒有 Pin 使用這個類型，直接刪除
      removeType(typeToRemove);
      load(); // 重新載入資料
      return;
    }

    // 有 Pin 使用這個類型，詢問用戶如何處理
    const alertButtons: any[] = [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除所有 Pin',
        style: 'destructive',
        onPress: () => {
          removeType(typeToRemove, undefined, true);
          load(); // 重新載入資料
        }
      }
    ];

    // 如果有其他類型，提供移動選項
    if (otherTypes.length > 0) {
      // 為每個其他類型添加移動選項
      otherTypes.forEach(targetType => {
        alertButtons.splice(-1, 0, {
          text: `移到「${targetType}」`,
          onPress: () => {
            removeType(typeToRemove, targetType);
            load(); // 重新載入資料
          }
        });
      });
    }

    Alert.alert(
      `刪除類型「${typeToRemove}」`,
      `此類型有 ${pinsWithThisType.length} 個 Pin，要如何處理？`,
      alertButtons
    );
  };

  // 處理分類刪除
  const handleRemoveCategory = (categoryToRemove: string) => {
    if (!mainType) return;

    const pinsWithThisCategory = list.filter(pin => 
      pin.type === mainType && pin.categories.includes(categoryToRemove)
    );
    
    if (pinsWithThisCategory.length === 0) {
      // 沒有 Pin 使用這個分類，直接刪除
      removeCategoryFromType(mainType, categoryToRemove);
      load(); // 重新載入資料
      return;
    }

    const otherCategories = availableCategories.filter(c => c !== categoryToRemove);
    
    const alertButtons: any[] = [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除所有 Pin',
        style: 'destructive',
        onPress: () => {
          removeCategoryFromType(mainType, categoryToRemove, undefined, true);
          load(); // 重新載入資料
        }
      }
    ];

    // 如果有其他分類，提供移動選項
    if (otherCategories.length > 0) {
      // 為每個其他分類添加移動選項
      otherCategories.forEach(targetCategory => {
        alertButtons.splice(-1, 0, {
          text: `移到「${targetCategory}」`,
          onPress: () => {
            removeCategoryFromType(mainType, categoryToRemove, targetCategory);
            load(); // 重新載入資料
          }
        });
      });
    }

    // 添加移到"其他"的選項
    alertButtons.splice(-1, 0, {
      text: '移到「其他」',
      onPress: () => {
        removeCategoryFromType(mainType, categoryToRemove, '其他');
        load(); // 重新載入資料
      }
    });

    Alert.alert(
      `刪除分類「${categoryToRemove}」`,
      `此分類有 ${pinsWithThisCategory.length} 個 Pin，要如何處理？`,
      alertButtons
    );
  };

  return (
    <View style={{ padding: 8 }}>
      {/* 上層類型 Chips 列 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Chip
            key='全部'
            mode='outlined'
            selected={mainType === null}
            style={{ 
              margin: 4, 
              borderRadius: 14, 
              borderColor: mainType === null ? palette.primary : '#ccc',
              backgroundColor: mainType === null ? palette.primary : '#fff'
            }}
            textStyle={{ color: mainType === null ? '#fff' : '#333' }}
            onPress={() => setMainType(null)}
          >全部</Chip>
          {availableTypes.map((t) => (
            <Chip
              key={t}
              mode='outlined'
              selected={mainType === t}
              style={{ 
                margin: 4, 
                borderRadius: 14, 
                borderColor: mainType === t ? palette.primary : '#ccc',
                backgroundColor: mainType === t ? palette.primary : '#fff'
              }}
              textStyle={{ color: mainType === t ? '#fff' : '#333' }}
              onPress={() => setMainType(t)}
              onLongPress={() => handleRemoveType(t)}
            >{t}</Chip>
          ))}
          {/* 新增類型 */}
          <Chip
            icon={props => <MaterialIcons name="add" size={16} color={palette.primary} />}
            textStyle={{ color: palette.primary }}
            style={{ 
              margin: 4, 
              borderRadius: 14, 
              borderColor: palette.primary,
              backgroundColor: '#fff'
            }}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Alert.prompt('新增類型', '請輸入類型名稱', txt => {
                  if (txt) {
                    addCustomType(txt);
                    setMainType(txt);
                  }
                });
              } else {
                const name = prompt('輸入類型名稱');
                if (name) {
                  addCustomType(name);
                  setMainType(name);
                }
              }
            }}
          >新增</Chip>
        </View>
      </ScrollView>

      {/* 縣市選單 */}
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Button 
            mode="outlined" 
            onPress={() => setOpen(true)}
            style={{ borderColor: palette.accent, borderRadius: 14 }}
            textColor={palette.accent}
            contentStyle={{ borderRadius: 14 }}
          >
            {county ?? '選擇縣市'}
          </Button>
        }
      >
        {/* 全部縣市放最上 */}
        <Menu.Item
          title="全部縣市"
          onPress={() => {
            setCounty(null);
            setOpen(false);
          }}
        />
        {dynamicCounties.map((c) => (
          <Menu.Item
            key={c}
            title={c}
            onPress={() => {
              setCounty(c as County);
              setOpen(false);
            }}
          />
        ))}
      </Menu>

      <Divider style={{ marginVertical: 6 }} />

      {/* 分類搜尋 + Chips 水平列 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {/* 搜尋框 */}
          <TextInput
            placeholder="搜尋"
            value={search}
            onChangeText={setSearch}
            mode="outlined"
            style={{ 
              width: 90, 
              height: 40, 
              margin: 4, 
              backgroundColor: '#fff' 
            }}
            outlineStyle={{ borderRadius: 14, borderWidth: 1 }}
            contentStyle={{ textAlign: 'center', paddingVertical: 0 }}
            textColor="#333"
          />
          {/* 全部類別 Chip */}
          <Chip
            key="全部類別"
            mode="outlined"
            selected={categories.length === 0}
            style={{ 
              margin: 4,
              borderRadius: 24,
              height: 40,
              justifyContent: 'center',
              borderColor: categories.length === 0 ? palette.accent : '#ccc',
              backgroundColor: categories.length === 0 ? palette.accent : '#fff',
            }}
            textStyle={{ 
              fontSize: 14,
              color: categories.length === 0 ? '#fff' : '#333',
            }}
            onPress={clearCategories}
          >全部</Chip>
          
          {/* 分類 Chips */}
          {filteredCategories.map((cat) => (
            <Chip
              key={cat}
              mode="outlined"
              selected={categories.includes(cat)}
              style={{ 
                margin: 4,
                borderRadius: 24,
                height: 40,
                justifyContent: 'center',
                borderColor: categories.includes(cat) ? palette.accent : '#ccc',
                backgroundColor: categories.includes(cat) ? palette.accent : '#fff',
              }}
              textStyle={{ 
                fontSize: 14,
                color: categories.includes(cat) ? '#fff' : '#333',
              }}
              selectedColor="#fff"
              showSelectedCheck={false}
              onPress={() => toggleCategory(cat)}
              onLongPress={() => handleRemoveCategory(cat)}
            >
              {cat}
            </Chip>
          ))}
          
          {/* 新增分類按鈕（僅在選擇類型時顯示） */}
          {mainType && (
            <Chip
              icon={props => <MaterialIcons name="add" size={16} color={palette.primary} />}
              textStyle={{ color: palette.primary }}
              style={{ 
                margin: 4,
                borderRadius: 24,
                height: 40,
                justifyContent: 'center',
                borderColor: palette.primary,
                backgroundColor: '#fff'
              }}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Alert.prompt('新增分類', `為「${mainType}」類型新增分類`, txt => {
                    if (txt?.trim()) {
                      addCategoryToType(mainType, txt.trim());
                    }
                  });
                } else {
                  const name = prompt(`為「${mainType}」類型新增分類`);
                  if (name?.trim()) {
                    addCategoryToType(mainType, name.trim());
                  }
                }
              }}
            >新增分類</Chip>
          )}
        </View>
      </ScrollView>
    </View>
  );
} 