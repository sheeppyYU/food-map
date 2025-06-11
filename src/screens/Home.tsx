import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

export default function HomeScreen() {
  const [region, setRegion] = useState<Region>({
    latitude: 25.033979,
    longitude: 121.564468,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    (async () => {
      // 取得使用者同意，並抓目前位置
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setRegion({
          ...region,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        setHasLocation(true);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation={hasLocation}
      >
        {/* 範例：在地圖上標記一個地點 */}
        <Marker
          coordinate={{ latitude: 25.033979, longitude: 121.564468 }}
          title="台北 101"
          description="這裡是台北 101"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});