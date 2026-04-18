import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  TouchableOpacity,
  Dimensions,
  Easing,
  Alert,
  Platform,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Helper to calculate distance in meters between two GPS coordinates
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ---------------------------------------------------------------------------
// Cross-platform location tracker
// - On web (Chromium): uses navigator.geolocation
// - On native: uses expo-location (imported lazily so web bundle never chokes)
// ---------------------------------------------------------------------------
const watchPositionCrossPlatform = async (onUpdate, onError) => {
  if (Platform.OS === 'web') {
    // Browser Geolocation API
    if (!navigator?.geolocation) {
      onError('Geolocation is not supported by this browser.');
      return () => {};
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => onUpdate(pos.coords.latitude, pos.coords.longitude),
      (err) => onError(err.message),
      { enableHighAccuracy: true, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(id);
  } else {
    // Native: expo-location
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      onError('Location permission denied.');
      return () => {};
    }
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (loc) => onUpdate(loc.coords.latitude, loc.coords.longitude)
    );
    return () => sub.remove();
  }
};

const GameScreen = ({ route }) => {
  const adventure = route?.params?.adventure;

  const parseDistance = (distStr) => {
    if (!distStr) return 1000;
    const match = distStr.match(/(\d+(\.\d+)?)\s*(km|m)?/i);
    if (!match) return 1000;
    const value = parseFloat(match[1]);
    const unit = match[3]?.toLowerCase();
    return unit === 'm' ? value : value * 1000;
  };

  const targetDistance = parseDistance(adventure?.distance);
  const [distanceWalked, setDistanceWalked] = useState(0);
  const [locationStatus, setLocationStatus] = useState('Requesting location...');
  const lastPositionRef = useRef(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);

  const progress = Math.min(distanceWalked / targetDistance, 1);

  useEffect(() => {
    setDistanceWalked(0);
    lastPositionRef.current = null;
    setLocationStatus('Requesting location...');

    let cleanup = () => {};

    const start = async () => {
      try {
        cleanup = await watchPositionCrossPlatform(
          (lat, lon) => {
            setLocationStatus('Tracking');
            if (lastPositionRef.current) {
              const delta = getDistance(
                lastPositionRef.current.latitude,
                lastPositionRef.current.longitude,
                lat,
                lon
              );
              setDistanceWalked((prev) => prev + delta);
            }
            lastPositionRef.current = { latitude: lat, longitude: lon };
          },
          (errMsg) => {
            setLocationStatus('Location unavailable: ' + errMsg);
          }
        );
      } catch (e) {
        setLocationStatus('Location error: ' + e.message);
      }
    };

    start();
    return () => { cleanup(); };
  }, [adventure?.id]);

  // Arrow spin logic
  const rotationValue = useRef(new Animated.Value(0)).current;
  const accumulatedDeg = useRef(0);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult(null);

    const outcome = Math.random() < 0.5 ? 'RIGHT' : 'LEFT';
    const desiredAngle = outcome === 'RIGHT' ? 0 : 180;

    const currentMod = ((accumulatedDeg.current % 360) + 360) % 360;
    let remainder = (desiredAngle - currentMod + 360) % 360;
    if (remainder === 0) remainder = 360;
    const extraSpins = (4 + Math.floor(Math.random() * 4)) * 360;
    const target = accumulatedDeg.current + extraSpins + remainder;

    Animated.timing(rotationValue, {
      toValue: target,
      duration: 2800 + Math.random() * 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      accumulatedDeg.current = target;
      setIsSpinning(false);
      setResult(outcome);
    });
  };

  const rotateDeg = rotationValue.interpolate({
    inputRange: [-36000, 36000],
    outputRange: ['-36000deg', '36000deg'],
  });

  const resultColor =
    result === 'LEFT' ? '#C0392B' : result === 'RIGHT' ? '#27AE60' : '#7A6651';

  return (
    <View style={styles.container}>
      {adventure && (
        <View style={styles.adventureInfo}>
          <Text style={styles.adventureTitle}>{adventure.title}</Text>
          <Text style={styles.adventureTarget}>Goal: {adventure.distance}</Text>
        </View>
      )}

      <View style={styles.resultContainer}>
        <Text style={[styles.resultText, { color: resultColor }]}>
          {result ?? (isSpinning ? '...' : 'TAP TO SPIN')}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={spin}
        style={styles.spinnerWrapper}
        disabled={isSpinning}
      >
        <View style={styles.outerRing}>
          <View style={styles.innerCircle}>
            <Animated.View
              style={[
                styles.arrowContainer,
                { transform: [{ rotate: rotateDeg }] },
              ]}
            >
              <View style={styles.tail} />
              <View style={styles.shaft} />
              <View style={styles.arrowHead} />
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Progress section - in normal flow, NOT position:absolute */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {Math.round(distanceWalked)}m / {targetDistance}m ({Math.round(progress * 100)}%)
        </Text>
        <Text style={styles.locationStatus}>{locationStatus}</Text>
      </View>
    </View>
  );
};

const SHAFT_W = 100;
const SHAFT_H = 10;
const HEAD_W = 22;
const HEAD_H = 30;
const TAIL_W = 10;
const TAIL_H = 18;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EBD7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  adventureInfo: {
    position: 'absolute',
    top: 60,
    alignItems: 'center',
  },
  adventureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C1F14',
    textAlign: 'center',
  },
  adventureTarget: {
    fontSize: 14,
    color: '#7A6651',
    marginTop: 4,
  },
  resultContainer: {
    marginBottom: 36,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
  },
  spinnerWrapper: {
    alignItems: 'center',
  },
  outerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#D4A96A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,169,106,0.08)',
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  innerCircle: {
    width: 155,
    height: 155,
    borderRadius: 78,
    backgroundColor: '#FFF8ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E8C88A',
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tail: {
    width: TAIL_W,
    height: TAIL_H,
    backgroundColor: '#2C1F14',
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  shaft: {
    width: SHAFT_W,
    height: SHAFT_H,
    backgroundColor: '#2C1F14',
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderTopWidth: HEAD_H / 2,
    borderBottomWidth: HEAD_H / 2,
    borderLeftWidth: HEAD_W,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#2C1F14',
  },
  // Progress bar in normal document flow
  progressSection: {
    marginTop: 48,
    width: '80%',
    alignItems: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 24,
    backgroundColor: '#E0D0B0',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D4A96A',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6200ee',
    borderRadius: 12,
  },
  progressText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2C1F14',
  },
  locationStatus: {
    marginTop: 4,
    fontSize: 10,
    color: '#7A6651',
    fontStyle: 'italic',
  },
});

export default GameScreen;
