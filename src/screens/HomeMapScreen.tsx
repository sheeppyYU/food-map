import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { FAB, Surface } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import FilterBar from '../../src/components/FilterBar';
import RestaurantBottomSheet from '../../src/components/RestaurantBottomSheet';
import { useFilters } from '../hooks/useFilters';
import { useRestaurants } from '../hooks/useRestaurants';
import { Restaurant } from '../models/Restaurant';

// 城市範圍的 delta 值（調整為半個台灣大小）
const CITY_REGION_DELTA = {
  latitudeDelta: 2,    // 從 0.5 改為 2，約可看到半個台灣
  longitudeDelta: 2,   // 從 0.5 改為 2，保持長寬比例
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
  latitudeDelta: 2,    // 從 3 改為 2，約可看到半個台灣
  longitudeDelta: 2,   // 從 3 改為 2，保持長寬比例
};

// 定義 PIN 顏色常數
const PIN_COLORS = {
  want: Platform.select({
    ios: '#FFB6C1', // iOS 櫻花粉色
    android: '#FF69B4', // Android 熱粉色
  }),
  visited: '#2196F3', // 藍色
  bad: '#333333', // 深灰色
  none: '#4CAF50', // 綠色
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
  const { county, categories } = useFilters();
  const [selected, setSelected] = React.useState<Restaurant | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region>(TAIWAN_REGION);
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

  const filtered = useMemo(
    () =>
      list.filter((r) => {
        if (county && r.county !== county) return false;
        if (categories.length && !categories.some((c) => r.categories.includes(c)))
          return false;
        return true;
      }),
    [list, county, categories],
  );

  const handleRestaurantUpdate = useCallback((updatedRestaurant: Restaurant) => {
    try {
      const updatedList = list.map(r => 
        r.id === updatedRestaurant.id ? updatedRestaurant : r
      );
      update(updatedRestaurant);
    } catch (error) {
      // 忽略錯誤
    }
  }, [update, list]);

  const handleMarkerPress = useCallback((restaurant: Restaurant) => {
    try {
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
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
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
              if (mapRef.current) {
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

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.filterContainer, { paddingTop: insets.top }]}>
        <Surface style={styles.filterCard}>
          <FilterBar />
        </Surface>
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        mapPadding={{ top: 100 + insets.top, right: 0, bottom: 0, left: 0 }}
      >
        {filtered.map((restaurant) => (
          <CustomMarker
            key={restaurant.id}
            restaurant={restaurant}
            onPress={() => handleMarkerPress(restaurant)}
          />
        ))}
      </MapView>

      <FAB 
        style={[styles.fab, { bottom: insets.bottom + 30 }]} 
        icon="plus" 
        onPress={() => {}} 
        customSize={56}
        mode="flat"
      />

      <RestaurantBottomSheet
        restaurant={selected}
        onClose={() => setSelected(null)}
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
