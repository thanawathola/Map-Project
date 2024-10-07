/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { API_URL } from '@env';

MapLibreGL.setAccessToken(null);

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});


type GeoJsonFeature = {
  id: string;
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: Record<string, any>;
};

type GeoJsonFeatureCollection = {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
};

const App: React.FC = () => {
  const [geo, setGeo] = useState<GeoJsonFeatureCollection | null>(null);

  useEffect(() => {
    async function getData() {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        const json: GeoJsonFeatureCollection = await response.json();
        console.log(json);
        setGeo(json);
      } catch (error: any) {
        console.error(error?.message);
      }
    }

    getData();
  }, []);

  return (
    <View style={styles.page}>
      <MapLibreGL.MapView
        style={styles.map}
        logoEnabled={false}
        styleURL="https://demotiles.maplibre.org/style.json">
        <MapLibreGL.Camera
          zoomLevel={5}
          centerCoordinate={geo ? geo.features[0].geometry.coordinates : [0, 0]}
        />
        {geo && (
          <MapLibreGL.ShapeSource id="pointSource" shape={geo}>
            <MapLibreGL.SymbolLayer
              id="pointLayer"
              style={{
                iconImage: require('./public/images/Map-marker.png'),
                iconSize: 0.06,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>
    </View>
  );
};

export default App;
