import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  TouchableOpacity,
  Easing,
} from 'react-native';

const DirectionSpinner = ({ onSpinFinished }) => {
  const [result, setResult] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // The Animated Value that drives the UI
  const rotationValue = useRef(new Animated.Value(0)).current;
  // A Ref to track the current logical angle (0 for Right, 180 for Left)
  const currentAngleRef = useRef(0);

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    // 1. Decide the destination (0 = Right, 180 = Left)
    const isRight = Math.random() < 0.5;
    const destinationAngle = isRight ? 0 : 180;

    // 2. Calculate the total degrees to travel
    const rounds = 5 * 360;
    const currentPos = currentAngleRef.current;
    
    // This formula finds the shortest distance to the destination and adds the rounds
    const extraShift = (destinationAngle - (currentPos % 360) + 360) % 360;
    const finalValue = currentPos + rounds + (extraShift === 0 ? 360 : extraShift);
    
    Animated.timing(rotationValue, {
      toValue: finalValue,
      duration: 3000,
      easing: Easing.out(Easing.bezier(0.15, 0, 0, 1)),
      useNativeDriver: true,
    }).start(() => {
      // 3. RECALCULATE LOGIC FROM FINAL VALUE
      const finalAngle = finalValue % 360;
      
      const actualDirection = (finalAngle === 0 || finalAngle === 360) ? 'RIGHT' : 'LEFT';
      setResult(actualDirection);

      // 4. CLEANUP
      currentAngleRef.current = finalAngle;
      rotationValue.setValue(finalAngle);
      setIsSpinning(false);

      if (onSpinFinished) {
        onSpinFinished(actualDirection);
      }
    });
  };

  // Map the number value to a string degree for the transform
  const rotateStr = rotationValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.spinnerWrapper}>
      <Text style={[styles.resultText, { color: result === 'LEFT' ? '#C0392B' : '#27AE60' }]}>
        {result || (isSpinning ? 'SPINNING...' : 'READY')}
      </Text>

      <TouchableOpacity onPress={spin} disabled={isSpinning} style={styles.spinnerArea}>
        <View style={styles.circle}>
          <Animated.View style={[styles.arrowGroup, { transform: [{ rotate: rotateStr }] }]}>
            {/* SHAFT: Horizontal bar */}
            <View style={styles.shaft} />
            {/* HEAD: Pointing RIGHT by default */}
            <View style={styles.head} />
            {/* TAIL: Small block at the back */}
            <View style={styles.tail} />
          </Animated.View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  spinnerWrapper: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resultText: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 20,
    minHeight: 40,
  },
  spinnerArea: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFF',
    borderWidth: 8,
    borderColor: '#D4A96A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowGroup: {
    width: 0,
    height: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shaft: {
    position: 'absolute',
    width: 90,
    height: 12,
    backgroundColor: '#2C1F14',
    left: -45, 
  },
  head: {
    position: 'absolute',
    left: 35, 
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 18,
    borderBottomWidth: 18,
    borderLeftWidth: 28,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#2C1F14',
  },
  tail: {
    position: 'absolute',
    left: -55, 
    width: 14,
    height: 22,
    backgroundColor: '#2C1F14',
    borderRadius: 2,
  }
});

export default DirectionSpinner;
