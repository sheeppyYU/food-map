import React from 'react';
import { ScrollView, View, Platform, Alert } from 'react-native';
import { Button, Chip, Divider, Menu, TextInput } from 'react-native-paper';
import { Plus } from 'lucide-react-native';
import { useFilters } from '../hooks/useFilters';
import { useRestaurants } from '../hooks/useRestaurants';
import { useTheme } from '../hooks/useTheme';
import type { County } from '../models/Restaurant';

const categoriesPreset: string[] = [];

export default function FilterBar() {
  const { county, categories, mainType, customTypes, setCounty, setMainType, addCustomType, removeType, toggleCategory, clearCategories } = useFilters();
  const { palette } = useTheme();
  const [open, setOpen] = React.useState(false);
  const { list } = useRestaurants();
  const [search, setSearch] = React.useState('');

  // 從所有餐廳資料中取得唯一分類
  const dynamicCategories = React.useMemo(() => {
    const all = list.flatMap((r) => r.categories);
    const uniq = Array.from(new Set([...all, ...categoriesPreset]));
    return search ? uniq.filter((c) => c.includes(search)) : uniq;
  }, [list, search]);

  // 動態縣市
  const dynamicCounties = React.useMemo<County[]>(() => {
    const uniq = Array.from(new Set(list.map((r) => r.county))) as County[];
    return uniq;
  }, [list]);

  return (
    <View style={{ padding: 8 }}>
      {/* 上層類型 Chips 列 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:8 }}>
        <View style={{ flexDirection:'row', alignItems:'center' }}>
          <Chip
            key='全部'
            mode='outlined'
            selected={mainType===null}
            style={{ margin:4, borderRadius:14, borderColor: mainType===null? palette.primary:'#ccc', backgroundColor:mainType===null?palette.primary:'#fff' }}
            textStyle={{ color: mainType===null?'#fff':'#333' }}
            onPress={()=>setMainType(null)}
          >全部</Chip>
          {[...new Set([...list.map(r=>r.type), ...customTypes])].map((t)=> (
            <Chip
              key={t}
              mode='outlined'
              selected={mainType===t}
              style={{ margin:4, borderRadius:14, borderColor: mainType===t? palette.primary:'#ccc', backgroundColor:mainType===t?palette.primary:'#fff' }}
              textStyle={{ color: mainType===t?'#fff':'#333' }}
              onPress={()=>setMainType(t)}
              onLongPress={()=>{
                if(customTypes.length<=1){ Alert.alert('提示','至少保留一個類型'); return; }
                Alert.alert(`刪除類型「${t}」?`,'此類型的 Pin 會如何處理？',[
                  { text:'取消', style:'cancel' },
                  { text:'刪除並移到其他', onPress:()=>{
                      // 呼叫更新 Pins 類型函式（後續實作）
                      removeType(t);
                    } },
                  { text:'刪除並刪除Pins', style:'destructive', onPress:()=>{
                      // TODO: delete pins by type backend function
                      removeType(t);
                    } }
                ]);
              }}
            >{t}</Chip>
          ))}
          {/* 新增類型 */}
          <Chip 
            icon={props=><Plus color={palette.primary} size={16} />}
            textStyle={{ color: palette.primary }}
            style={{ margin:4, borderRadius:14, borderColor: palette.primary,backgroundColor:'#fff'}}
            onPress={()=>{
              if(Platform.OS==='ios'){
                Alert.prompt('新增類型','請輸入類型名稱',txt=>{ if(txt){ addCustomType(txt); setMainType(txt);} });
              }else{
                // Android 使用者簡易 prompt
                const name = prompt('輸入類型名稱');
                if(name){ addCustomType(name); setMainType(name);} }
            }} >新增</Chip>
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
            style={{ borderColor: palette.accent, borderRadius:14 }}
            textColor={palette.accent}
            contentStyle={{ borderRadius:14 }}
          >
            {county ?? '選擇縣市'}
          </Button>
        }>
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
            style={{ width: 90, height: 40, margin: 4, backgroundColor: '#fff' }}
            outlineStyle={{ borderRadius: 14, borderWidth:1 }}
            contentStyle={{ textAlign: 'center', paddingVertical: 0 }}
            textColor="#333"
          />
          {/* 全部類別 Chip */}
          <Chip
            key="全部類別"
            mode="outlined"
            selected={categories.length===0}
            style={{ 
              margin: 4,
              borderRadius: 24,
              height: 40,
              justifyContent: 'center',
              borderColor: categories.length===0 ? palette.accent : '#ccc',
              backgroundColor: categories.length===0 ? palette.accent : '#fff',
            }}
            textStyle={{ 
              fontSize: 14,
              color: categories.length===0 ? '#fff' : '#333',
            }}
            onPress={()=>{
              clearCategories();
            }}
          >全部</Chip>
          {dynamicCategories.map((cat) => (
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
            >
              {cat}
            </Chip>
          ))}
        </View>
      </ScrollView>

      {/* 叢集地圖已由 HomeMapScreen 控制，FilterBar 不再渲染地圖 */}
    </View>
  );
} 