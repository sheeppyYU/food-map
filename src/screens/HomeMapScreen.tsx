import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Alert as RNAlert, StyleSheet, View, Alert, Text } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewClustering from 'react-native-map-clustering';
import { FAB, Surface, Dialog, Button } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import FilterBar from '../../src/components/FilterBar';
import RestaurantBottomSheet from '../../src/components/RestaurantBottomSheet';
import { clearAllPins, seedFakePins, seedClusterPins } from '../../src/models/PinDB';
import { useFilters } from '../hooks/useFilters';
import { useRestaurants } from '../hooks/useRestaurants';
import { Restaurant } from '../models/Restaurant';
import { useTheme } from '../hooks/useTheme';

// 城市範圍的 delta 值（調整為半個台灣大小）
const CITY_REGION_DELTA = {
  latitudeDelta: 1,    // 從 0.5 改為 0.5，約可看到半個台灣
  longitudeDelta: 1,   // 從 0.5 改為 0.5，保持長寬比例
};

// 台灣主要城市的位置
const TAIWAN_CITIES = {
  TAIPEI: {
    name: '台北',
    latitude: 25.0330,
    longitude: 121.5654,
  },
  TAICHUNG: {
    name: '台中',
    latitude: 24.1477,
    longitude: 120.6736,
  },
  KAOHSIUNG: {
    name: '高雄',
    latitude: 22.6273,
    longitude: 120.3014,
  },
} as const;

// 預設使用台北位置
const DEFAULT_CITY = TAIWAN_CITIES.TAIPEI;

// 預設台灣區域（調整為半個台灣大小）
const TAIWAN_REGION: Region = {
  latitude: DEFAULT_CITY.latitude,
  longitude: DEFAULT_CITY.longitude,
  latitudeDelta: 0.5,    // 從 3 改為 0.5，約可看到半個台灣
  longitudeDelta: 0.5,   // 從 3 改為 0.5，保持長寬比例
};

// 固定 PIN 顏色（不隨主題變動）
const PIN_COLORS = {
  want: Platform.select({ ios: '#FFB6C1', android: '#FF69B4' }),
  visited: '#2196F3',
  bad: '#333333',
  none: '#4CAF50',
} as const;

// 自定義標記組件
const CustomMarker = React.memo(({ 
  restaurant, 
  onPress 
}: { 
  restaurant: Restaurant; 
  onPress: () => void;
}) => {
  const color = PIN_COLORS[restaurant.status] || PIN_COLORS.none;
  const [track, setTrack] = useState(false);

  useEffect(() => {
    if (restaurant.status) {
      setTrack(true);
      const t = setTimeout(() => setTrack(false), 100);
      return () => clearTimeout(t);
    }
  }, [restaurant.status]);
  
  // 使用相同的標記樣式
  const markerContent = (
    <View style={styles.markerContainer}>
      <View style={[styles.markerHead, { backgroundColor: color }]} />
      <View style={[styles.markerStem, { backgroundColor: color }]} />
    </View>
  );

  return (
    <Marker
      coordinate={{ latitude: restaurant.lat, longitude: restaurant.lng }}
      onPress={onPress}
      tracksViewChanges={track}
      key={restaurant.id}
    >
      {markerContent}
    </Marker>
  );
}, (prevProps, nextProps) => {
  if (prevProps.restaurant.status !== nextProps.restaurant.status) {
    return false;
  }
  return true;
});

export default function HomeMapScreen() {
  const { list, load, update } = useRestaurants();
  const { palette, toggle: toggleTheme } = useTheme();
  const { county, categories, mainType, setCounty } = useFilters();
  const [selected, setSelected] = React.useState<Restaurant | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region>(TAIWAN_REGION);
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [skipZoom, setSkipZoom] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const filtered = useMemo(
    () =>
      list.filter((r) => {
        if (mainType && r.type !== mainType) return false;
        if (county && r.county !== county) return false;
        if (categories.length && !categories.some((c) => r.categories.includes(c)))
          return false;
        return true;
      }),
    [list, county, categories, mainType],
  );

  const handleRestaurantUpdate = useCallback((updatedRestaurant: Restaurant) => {
    try {
      setSkipZoom(true);
      update(updatedRestaurant);
    } catch (error) {
      // 忽略錯誤
    }
  }, [update]);

  const handleMarkerPress = useCallback((restaurant: Restaurant) => {
    try {
      setSkipZoom(true);
      setSelected(restaurant);
    } catch (error) {
      // 忽略錯誤
    }
  }, []);

  // 檢查位置服務是否啟用
  const checkLocationServices = async () => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      return false;
    }
  };

  // 請求位置權限
  const requestLocationPermission = async () => {
    try {
      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        return false;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      return false;
    }
  };

  // 獲取當前位置
  const getCurrentLocation = useCallback(async () => {
    try {
      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        setInitialRegion({
          latitude: DEFAULT_CITY.latitude,
          longitude: DEFAULT_CITY.longitude,
          ...CITY_REGION_DELTA
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const isInTaiwan = location.coords.latitude >= 21.5 && 
                        location.coords.latitude <= 25.5 && 
                        location.coords.longitude >= 119.5 && 
                        location.coords.longitude <= 122.5;
      
      if (!isInTaiwan) {
        setInitialRegion({
          latitude: DEFAULT_CITY.latitude,
          longitude: DEFAULT_CITY.longitude,
          ...CITY_REGION_DELTA
        });
        return;
      }

      const { latitude, longitude } = location.coords;
      const newRegion = {
        latitude,
        longitude,
        ...CITY_REGION_DELTA
      };
      
      if (mapRef.current && !skipZoom) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
      // 反向地理編碼取得縣市但不自動設定過濾器，保持全部顯示
      // const { region, subregion, city: cityName, district } = geo[0] as any;
      // const pick = [region, subregion, cityName, district].find(
      //   (x) => typeof x === 'string' && /[縣市]$/.test(x as string),
      // );
      // if (pick) setCounty(pick as any);
      setInitialRegion(newRegion);
    } catch (error) {
      setInitialRegion({
        latitude: DEFAULT_CITY.latitude,
        longitude: DEFAULT_CITY.longitude,
        ...CITY_REGION_DELTA
      });
    }
  }, []);

  // 初始化位置
  useEffect(() => {
    let isMounted = true;

    const initLocation = async () => {
      const hasPermission = await requestLocationPermission();
      
      if (hasPermission && isMounted) {
        await getCurrentLocation();
      } else if (isMounted) {
        setInitialRegion(TAIWAN_REGION);
      }
    };

    initLocation();

    return () => {
      isMounted = false;
    };
  }, [getCurrentLocation]);

  // 監聽位置變化
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationUpdates = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 1000,
              timeInterval: 5000,
            },
            (location) => {
              if (mapRef.current && !skipZoom) {
                const newRegion = {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  ...CITY_REGION_DELTA
                };
                mapRef.current.animateToRegion(newRegion, 1000);
              }
            }
          );
        }
      } catch (error) {
        // 忽略錯誤
      }
    };

    startLocationUpdates();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // 每次畫面重新取得焦點時重新讀取 pins
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  // 監聽縣市改變自動定位（僅在未開啟 BottomSheet 時觸發，避免點擊卡片內按鈕時縮放）
  useEffect(() => {
    if (selected) return; // BottomSheet 開啟中，忽略縮放
    if (county && list.length && mapRef.current) {
      const countyPins = list.filter((r) => r.county === county && r.lat && r.lng);
      if (countyPins.length) {
        const avgLat = countyPins.reduce((sum, p) => sum + p.lat, 0) / countyPins.length;
        const avgLng = countyPins.reduce((sum, p) => sum + p.lng, 0) / countyPins.length;
        const region = {
          latitude: avgLat,
          longitude: avgLng,
          ...CITY_REGION_DELTA,
        } as Region;
        if(!skipZoom) mapRef.current.animateToRegion(region, 1000);
      }
    }
  }, [county, list, selected, skipZoom]);

  const handleClearAll = () => {
    RNAlert.alert('確認', '確定要刪除所有 Pin 嗎？此動作無法恢復！', [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: () => {
          clearAllPins(() => {
            load();
          });
        }
      },
    ]);
  };

  const renderCluster = useCallback((cluster: any, onPress: () => void) => {
    const { geometry, properties } = cluster;
    const pointCount = properties.point_count as number;
    // geometry.coordinates = [lng, lat]
    const coordinate = { latitude: geometry.coordinates[1], longitude: geometry.coordinates[0] };
    const size = Math.min(60, 30 + pointCount * 0.5);
    return (
      <Marker coordinate={coordinate} onPress={onPress} tracksViewChanges={false}>
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.primary,
          borderWidth: 2,
          borderColor: '#fff',
        }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>{pointCount}</Text>
        </View>
      </Marker>
    );
  }, [palette.primary]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.filterContainer, { paddingTop: insets.top }]}>
        <Surface style={styles.filterCard}>
          <FilterBar />
        </Surface>
      </View>

      <MapViewClustering
        provider={PROVIDER_GOOGLE}
        mapRef={(ref:any)=>{ (mapRef as any).current = ref; }}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        clusterColor={palette.primary}
        clusterTextColor="#fff"
        radius={200}
        renderCluster={renderCluster as any}
        onRegionChangeComplete={(region)=>setInitialRegion(region)}
        tracksViewChanges={false}
        mapPadding={{ top: 100 + insets.top, right: 0, bottom: 0, left: 0 }}
      >
        {list.map((restaurant) => (
          <Marker
            key={restaurant.id}
            coordinate={{ latitude: restaurant.lat, longitude: restaurant.lng }}
            pinColor={PIN_COLORS[restaurant.status]}
            onPress={() => handleMarkerPress(restaurant)}
          />
        ))}
      </MapViewClustering>

      {/* 新增 Pin */}
      <FAB 
        style={[styles.fab, { bottom: insets.bottom + 30, backgroundColor: '#fff' }]} 
        icon="plus" 
        color={palette.primary}
        onPress={() => router.push('/add-pin')}
        customSize={56}
        mode="flat"
      />

      {/* 設定 FAB */}
      <FAB
        style={[styles.fab, { bottom: insets.bottom + 100, backgroundColor: palette.accent }]} 
        icon="cog"
        onPress={() => setSettingsVisible(true)}
        customSize={48}
      />

      {/* 設定 Dialog */}
      <Dialog visible={settingsVisible} onDismiss={()=>setSettingsVisible(false)}>
        <Dialog.Title>設定</Dialog.Title>
        <Dialog.Content>
          <Button
            icon="download"
            textColor={palette.primary}
            onPress={()=>{
              setSettingsVisible(false);
              Alert.alert('匯入示範資料','將匯入示範 Pin 並重新整理列表',[
                {text:'取消', style:'cancel'},
                {text:'匯入', onPress:()=>{ seedFakePins(()=>{ load(); }); }}
              ]);
            }}
          >匯入示範資料</Button>
          <Button
            icon="delete"
            textColor={palette.delete}
            onPress={()=>{
              setSettingsVisible(false);
              handleClearAll();
            }}
          >刪除所有 Pin</Button>
          <Button
            icon="palette"
            textColor={palette.accent}
            onPress={()=>{
              toggleTheme();
              setSettingsVisible(false);
            }}
          >切換配色</Button>
          <Button
            icon="map"
            textColor={palette.accent}
            onPress={()=>{
              setSettingsVisible(false);
              Alert.alert('匯入叢集測試資料','將在台北101附近新增 200 筆 Pin',[
                {text:'取消',style:'cancel'},
                {text:'確定',onPress:()=>{ seedClusterPins(200, ()=>load()); }}
              ]);
            }}
          >匯入叢集測試</Button>
          <Button
            icon="layers"
            textColor={palette.accent}
            onPress={() => {
              setSettingsVisible(false);
              router.push('/test-cluster');
            }}
          >
            前往叢集測試頁面
          </Button>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={()=>setSettingsVisible(false)}>關閉</Button>
        </Dialog.Actions>
      </Dialog>

      <RestaurantBottomSheet
        restaurant={selected}
        onClose={() => {
          setSelected(null);
          setTimeout(() => setSkipZoom(false), 800);
        }}
        onUpdate={handleRestaurantUpdate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  filterContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    padding: 16,
  },
  filterCard: {
    borderRadius: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  map: StyleSheet.absoluteFillObject,
  fab: { 
    position: 'absolute', 
    right: 20, 
    bottom: 30,
    borderRadius: 20,
    elevation: 8,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerHead: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: Platform.OS === 'android' ? 6 : 4,
  },
  markerStem: {
    width: 4,
    height: 12,
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#fff',
    elevation: Platform.OS === 'android' ? 4 : 2,
  },
});
