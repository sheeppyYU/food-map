import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { FAB, Surface } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import FilterBar from '../../src/components/FilterBar';
import RestaurantBottomSheet from '../../src/components/RestaurantBottomSheet';
import { useFilters } from '../hooks/useFilters';
import { useRestaurants } from '../hooks/useRestaurants';
import { Restaurant } from '../models/Restaurant';

export default function HomeMapScreen() {
  const insets = useSafeAreaInsets();
  const { list, load } = useRestaurants();
  const { county, categories } = useFilters();
  const [selected, setSelected] = React.useState<Restaurant | null>(null);

  useEffect(load, []);

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.filterContainer, { paddingTop: insets.top }]}>
        <Surface style={styles.filterCard}>
          <FilterBar />
        </Surface>
      </View>

      <MapView
        style={styles.map}
        mapPadding={{ top: 100 + insets.top, right: 0, bottom: 0, left: 0 }}
      >
        {filtered.map((r) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.lat, longitude: r.lng }}
            pinColor={
              r.status === 'bad'
                ? 'black'
                : r.status === 'visited'
                ? '#2196F3'  // 藍色
                : r.status === 'want'
                ? '#FFB6C1'  // 櫻花粉色
                : '#4CAF50'  // 綠色
            }
            onPress={() => setSelected(r)}
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
});
