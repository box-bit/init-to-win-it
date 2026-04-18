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
} from 'react-native';
import * as Location from 'expo-location';

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
  const lastPositionRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null); // null | 'LEFT' | 'RIGHT'

  const progress = Math.min(distanceWalked / targetDistance, 1);

  useEffect(() => {
    setDistanceWalked(0);
    lastPositionRef.current = null;

    let locationSubscription = null;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS tracking requires location permissions.');
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          if (lastPositionRef.current) {
            const delta = getDistance(
              lastPositionRef.current.latitude,
              lastPositionRef.current.longitude,
              latitude,
              longitude
            );
            setDistanceWalked((prev) => prev + delta);
          }
          lastPositionRef.current = { latitude, longitude };
        }
      );
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [adventure?.id]);

  const rotationValue = useRef(new Animated.Value(0)).current;

  // FIX: Track the last NORMALIZED landing angle (0 or 180) separately
  // from the accumulated raw degrees. This lets us always compute the next
  // target correctly regardless of how many full rotations have accumulated.
  const accumulatedDeg = useRef(0); // total raw degrees spun so far
  const lastLandingAngle = useRef(0); // 0 = pointing RIGHT, 180 = pointing LEFT

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult(null);

    const outcome = Math.random() < 0.5 ? 'RIGHT' : 'LEFT';

    // Desired final angle (absolute, not relative):
    //   RIGHT -> 0 deg (or any multiple of 360)
    //   LEFT  -> 180 deg (or 180 + multiple of 360)
    const desiredAngle = outcome === 'RIGHT' ? 0 : 180;

    // How many extra degrees to spin from the current accumulated position
    // so we land exactly on desiredAngle after at least 4 full rotations.
    //
    // We need: (accumulatedDeg + extraDeg) % 360 === desiredAngle
    // => extraDeg = (desiredAngle - accumulatedDeg % 360 + 360) % 360
    // Then we add enough full spins (>=4) on top.
    const currentMod = ((accumulatedDeg.current % 360) + 360) % 360;
    let remainder = (desiredAngle - currentMod + 360) % 360;
    // Guarantee at least one full rotation even when remainder is 0
    if (remainder === 0) remainder = 360;
    const extraSpins = (4 + Math.floor(Math.random() * 4)) * 360;
    const extraDeg = extraSpins + remainder;
    const target = accumulatedDeg.current + extraDeg;

    Animated.timing(rotationValue, {
      toValue: target,
      duration: 2800 + Math.random() * 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      accumulatedDeg.current = target;
      lastLandingAngle.current = desiredAngle;
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

      {/* Result / idle label */}
      <View style={styles.resultContainer}>
        <Text style={[styles.resultText, { color: resultColor }]}>
          {result ?? (isSpinning ? '...' : 'TAP TO SPIN')}
        </Text>
      </View>

      {/* Spinner */}
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
              {/* Blunt tail (left side) */}
              <View style={styles.tail} />
              {/* Shaft */}
              <View style={styles.shaft} />
              {/* Arrowhead pointing RIGHT */}
              <View style={styles.arrowHead} />
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>

      {/* FIX: Progress bar rebuilt without overflow:hidden on the outer
          container, so the label text is never clipped. The filled bar is
          rendered as a sibling behind the label using absolute positioning
          on a wrapper that does NOT clip its children. */}
      <View style={styles.progressBarOuter}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {Math.round(distanceWalked)}m / {targetDistance}m ({Math.round(progress * 100)}%)
        </Text>
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
  // Progress bar - FIX: split into an outer wrapper (no overflow:hidden),
  // a track layer (overflow:hidden for the fill bar only), and a text label
  // rendered outside the clipping context.
  progressBarOuter: {
    position: 'absolute',
    bottom: 40,
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
  },
  progressText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2C1F14',
  },
});

export default GameScreen;
