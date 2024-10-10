/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {StyleSheet, View, Button, TouchableOpacity, Text} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import axios from 'axios';
import {API_URL} from '@env';
import Icon from 'react-native-vector-icons/MaterialIcons';

MapLibreGL.setAccessToken(null);

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  LoadButtonContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'column',
    alignItems: 'center',
  },
  ZoomButtonContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'column',
    alignItems: 'center',
  },
  TotalNumberMatchedContainer: {
    position: 'absolute',
    top: 25,
    left: 10,
    backgroundColor: 'white',
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
  },
  button: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 10,
    marginVertical: 5,
    elevation: 3,
  },
  icon: {
    color: 'black',
  },
  CountMarks: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
  },
  text: {
    fontSize: 14,
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

interface ApiResponse {
  numberMatched: number;
}

const BATCH_SIZE = 500;
const LIMIT = 10000;
const ZOOM = 0.5;
const MAX_ZOOM_LEVEL = 9;
const MIN_ZOOM_LEVEL = 0;

const App: React.FC = () => {
  const [features, setFeatures] = useState<GeoJsonFeature[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(5);

  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const cameraRef = useRef<any>(null);

  const [numberMatched, setNumberMatched] = useState<number | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        const json: ApiResponse = await response.json();
        setNumberMatched(json.numberMatched);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);
  const fetchFeatures = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const response = await axios.get<GeoJsonFeatureCollection>(API_URL, {
        params: {
          limit: BATCH_SIZE,
          offset: page * BATCH_SIZE,
        },
      });

      if (response.status === 200) {
        setFeatures(prevFeatures =>
          prevFeatures.length < LIMIT
            ? [...prevFeatures, ...response.data.features]
            : [...prevFeatures],
        );
        if (response.data.features.length > 0 && page === 0) {
          centerMapOnCoordinates(
            response.data.features[0].geometry.coordinates,
          );
        }
      } else {
        throw new Error(`Response status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error?.message ?? error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures(currentPage);
  }, [fetchFeatures, currentPage]);

  const centerMapOnCoordinates = (coordinates: [number, number]) => {
    if (
      cameraRef.current &&
      typeof cameraRef.current.setCamera === 'function'
    ) {
      cameraRef.current.setCamera({
        centerCoordinate: coordinates,
        animationMode: 'easeTo',
        animationDuration: 1000,
      });
      setMapCenter(coordinates);
    }
  };

  const loadMoreFeatures = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  const zoomIn = () => {
    const newZoom = Math.min(zoomLevel + ZOOM, MAX_ZOOM_LEVEL);
    setZoomLevel(newZoom);
    if (
      cameraRef.current &&
      typeof cameraRef.current.setCamera === 'function'
    ) {
      cameraRef.current.setCamera({
        zoomLevel: newZoom,
        centerCoordinate: mapCenter,
        animationMode: 'easeTo',
        animationDuration: 500,
      });
    }
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoomLevel - ZOOM, MIN_ZOOM_LEVEL);
    setZoomLevel(newZoom);
    if (
      cameraRef.current &&
      typeof cameraRef.current.setCamera === 'function'
    ) {
      cameraRef.current.setCamera({
        zoomLevel: newZoom,
        centerCoordinate: mapCenter,
        animationMode: 'easeTo',
        animationDuration: 500,
      });
    }
  };

  return (
    <View style={styles.page}>
      <MapLibreGL.MapView
        style={styles.map}
        logoEnabled={false}
        styleURL="https://demotiles.maplibre.org/style.json">
        <MapLibreGL.Camera ref={cameraRef} zoomLevel={zoomLevel} />
        {features.length > 0 && (
          <MapLibreGL.ShapeSource
            id="pointSource"
            shape={{type: 'FeatureCollection', features}}>
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
      <View style={styles.TotalNumberMatchedContainer}>
        {/* Conditional rendering to handle loading state */}
        <Text style={styles.text}>
          Total Number Matched:{' '}
          {numberMatched !== null ? numberMatched : 'Loading...'}
        </Text>
        <Text style={styles.text}>Current Markers:{features.length}</Text>
      </View>
      <View style={styles.LoadButtonContainer}>
        <Button
          title={loading ? 'Loading...' : 'Load More Markers'}
          onPress={loadMoreFeatures}
          disabled={loading || features.length >= LIMIT}
        />
      </View>
      <View style={styles.ZoomButtonContainer}>
        {/* Zoom In Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={zoomIn}
          disabled={zoomLevel >= MAX_ZOOM_LEVEL}>
          <Icon name="zoom-in" size={30} style={styles.icon} />
        </TouchableOpacity>
        {/* Zoom Out Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={zoomOut}
          disabled={zoomLevel <= MIN_ZOOM_LEVEL}>
          <Icon name="zoom-out" size={30} style={styles.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default App;
