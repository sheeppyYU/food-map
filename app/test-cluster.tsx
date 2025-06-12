// app/test-cluster.tsx
import React, { useEffect } from 'react';
const RawClustering: any = require('react-native-map-clustering');
const MapViewClustering: any = RawClustering?.default || RawClustering?.ClusteredMapView || RawClustering;
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

export default function TestClusterScreen() {
  useEffect(()=>{
    console.log('Navigated to /test-cluster');
    console.log('MapViewClustering type:', typeof MapViewClustering);
    console.log('RawClustering keys:', Object.keys(RawClustering));
    console.log('RawClustering.default type:', typeof RawClustering.default);
    console.log('RawClustering.default keys:', RawClustering.default ? Object.keys(RawClustering.default) : 'null');
    // 嘗試取得更深層的 default
    console.log('RawClustering.default.default type:', RawClustering?.default?.default ? typeof RawClustering.default.default : 'undefined');
  },[]);

  // 固定中心在台北 101
  const region = {
    latitude: 25.033964,
    longitude: 121.564468,
    latitudeDelta: 0.5,    // 增加視野範圍，方便叢集
    longitudeDelta: 0.5,
  };
  // 產生 200 顆都落在 101 周圍的小偏移 Pin
  const pins = Array.from({ length: 200 }, (_, i) => ({
    id: String(i),
    lat: 25.033964 + (Math.random() - 0.5) * 0.01,
    lng: 121.564468 + (Math.random() - 0.5) * 0.01,
  }));

  // 自訂叢集渲染，顯示帶數字的藍色圓形
  const renderCluster = (cluster: any, onPress: () => void) => {
    console.log('renderCluster cluster:', cluster);
    const { geometry, properties } = cluster;
    const pointCount = properties.point_count as number;
    const coordinate = { latitude: geometry.coordinates[1], longitude: geometry.coordinates[0] };
    const size = Math.min(60, 30 + pointCount * 0.5);
    return (
      <Marker coordinate={coordinate} onPress={onPress} tracksViewChanges={false}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#007AFF',
            borderWidth: 2,
            borderColor: '#fff',
          }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>{pointCount}</Text>
        </View>
      </Marker>
    );
  };

  // 處理叢集點擊事件
  const handleClusterPress = (cluster: any) => {
    console.log('Cluster pressed:', cluster);
    // 這裡可以添加放大邏輯或其他操作
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MapViewClustering
        provider={PROVIDER_GOOGLE}
        // 提供空 mapRef，以避免 restProps.mapRef undefined
        mapRef={() => {}}
        style={{ flex: 1 }}
        initialRegion={region}
        radius={60}
        clusterColor="#007AFF"
        clusterTextColor="#fff"
        /* 暫時不用自訂 renderCluster，改用內建 ClusterMarker 以驗證 */
        // renderCluster={renderCluster as any}
        onRegionChangeComplete={(r: any, markers?: any) => {
          console.log('Map onRegionChangeComplete region:', r);
          if(markers) console.log('Map onRegionChangeComplete markers len:', markers.length);
        }}
        onClusterPress={handleClusterPress}
        onMarkersChange={(markers:any)=>{
          console.log('onMarkersChange markers length:', markers.length);
          console.log(markers.slice(0,5));
        }}
      >
        {pins.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
          />
        ))}
      </MapViewClustering>
    </SafeAreaView>
  );
}