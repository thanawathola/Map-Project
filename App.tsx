/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Button } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import axios from 'axios';
import { API_URL } from '@env';

MapLibreGL.setAccessToken(null);

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 5,
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

const BATCH_SIZE = 100;

const App: React.FC = () => {
  const [features, setFeatures] = useState<GeoJsonFeature[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFeatures(currentPage);
  }, [currentPage]);

  const fetchFeatures = async (page: number) => {
    try {
      setLoading(true);
      const response = await axios.get<GeoJsonFeatureCollection>(API_URL, {
        params: {
          limit: BATCH_SIZE,
          offset: page * BATCH_SIZE,
        },
      });

      if (response.status === 200) {
        setFeatures(prevFeatures => [...prevFeatures, ...response.data.features]);
      } else {
        throw new Error(`Response status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error?.message ?? error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreFeatures = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  return (
    <View style={styles.page}>
      <MapLibreGL.MapView
        style={styles.map}
        logoEnabled={false}
        styleURL="https://demotiles.maplibre.org/style.json"
      >
        <MapLibreGL.Camera
          zoomLevel={5}
          centerCoordinate={features[0]?.geometry.coordinates || [0, 0]}
        />
        {features.length > 0 && (
          <MapLibreGL.ShapeSource
            id="pointSource"
            shape={{ type: 'FeatureCollection', features }}
          >
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
      <View style={styles.buttonContainer}>
        <Button
          // eslint-disable-next-line quotes
          title={loading ? "Loading..." : "Load More"}
          onPress={loadMoreFeatures}
          disabled={loading}
        />
      </View>
    </View>
  );
};

export default App;
