/**
 * Gesture recognition utilities for HandBloom AI
 * Uses MediaPipe hand landmark data to detect gestures
 */

// Calculate distance between two points
export const distance = (p1, p2) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// Get finger tip landmarks indices
export const FINGER_TIPS = [4, 8, 12, 16, 20]; // thumb, index, middle, ring, pinky
export const FINGER_BASES = [2, 5, 9, 13, 17];

// Count extended fingers
export const countExtendedFingers = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return 0;
  let count = 0;
  
  // Thumb (special case - compare x coordinate)
  const thumbTip = landmarks[4];
  const thumbBase = landmarks[2];
  if (Math.abs(thumbTip.x - thumbBase.x) > 0.05) count++;
  
  // Other fingers
  for (let i = 1; i < 5; i++) {
    const tip = landmarks[FINGER_TIPS[i]];
    const pip = landmarks[FINGER_TIPS[i] - 2]; // PIP joint
    if (tip.y < pip.y - 0.02) count++;
  }
  
  return count;
};

// Detect open palm
export const isOpenPalm = (landmarks) => {
  return countExtendedFingers(landmarks) >= 4;
};

// Detect closed fist
export const isClosedFist = (landmarks) => {
  return countExtendedFingers(landmarks) === 0;
};

// Detect pinch (thumb + index close together)
export const getPinchDistance = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return null;
  const thumb = landmarks[4];
  const index = landmarks[8];
  return distance(thumb, index);
};

// Detect thumbs up
export const isThumbsUp = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return false;
  const thumbTip = landmarks[4];
  const thumbBase = landmarks[2];
  const otherFingersDown = [8, 12, 16, 20].every(i => landmarks[i].y > landmarks[i-2].y + 0.02);
  return thumbTip.y < thumbBase.y - 0.05 && otherFingersDown;
};

// Detect two fingers (peace sign)
export const isTwoFingers = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return false;
  const index = landmarks[8];
  const indexPIP = landmarks[6];
  const middle = landmarks[12];
  const middlePIP = landmarks[10];
  const ring = landmarks[16];
  const ringPIP = landmarks[14];
  const pinky = landmarks[20];
  const pinkyPIP = landmarks[18];
  
  const indexUp = index.y < indexPIP.y - 0.02;
  const middleUp = middle.y < middlePIP.y - 0.02;
  const ringDown = ring.y > ringPIP.y - 0.01;
  const pinkyDown = pinky.y > pinkyPIP.y - 0.01;
  
  return indexUp && middleUp && ringDown && pinkyDown;
};

// Detect heart gesture shape (curved index and thumb tips meeting)
export const isHeartGesture = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return false;
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  
  // Heart gesture is approximated by thumb and index tips being moderately close
  // and other fingers curled in towards the palm.
  const mainDist = distance(thumbTip, indexTip);
  const ringPIP = landmarks[14];
  const pinkyPIP = landmarks[18];
  const othersCurled = landmarks[16].y > ringPIP.y && landmarks[20].y > pinkyPIP.y;
  
  return mainDist > 0.05 && mainDist < 0.12 && othersCurled && middleTip.y < indexTip.y;
};

// Detect star gesture shape (all fingers fully spread out wide)
export const isStarGesture = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return false;
  const thumbTip = landmarks[4];
  const pinkyTip = landmarks[20];
  const spreadDist = distance(thumbTip, pinkyTip);
  return isOpenPalm(landmarks) && spreadDist > 0.22;
};

// Detect circle gesture (index and thumb forming an O shape)
export const isCircleGesture = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return false;
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const d = distance(thumbTip, indexTip);
  // O-shape is tight pinch of thumb + index, but with index PIP curved
  const indexPIP = landmarks[6];
  const indexCurved = indexTip.y > indexPIP.y;
  return d < 0.04 && indexCurved;
};

// Detect hand clap (approximate by quick distance reduction if multiple hands,
// or simulated gesture mapping)
export const isHandClap = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return false;
  // Clap triggers if hand velocity is high or specific posture
  return false;
};

// Get wrist rotation angle
export const getWristRotation = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return 0;
  const wrist = landmarks[0];
  const middle = landmarks[9];
  return Math.atan2(middle.y - wrist.y, middle.x - wrist.x) * (180 / Math.PI);
};

// Main gesture classifier
export const classifyGesture = (landmarks) => {
  if (!landmarks) return 'none';
  
  const fingerCount = countExtendedFingers(landmarks);
  
  if (isThumbsUp(landmarks)) return 'thumbs_up';
  if (isClosedFist(landmarks)) return 'fist';
  if (isTwoFingers(landmarks)) return 'two_fingers';
  if (isHeartGesture(landmarks)) return 'heart_gesture';
  if (isStarGesture(landmarks)) return 'star_gesture';
  if (isCircleGesture(landmarks)) return 'circle_gesture';
  if (isOpenPalm(landmarks)) return 'open_palm';
  if (fingerCount === 5) return 'five_fingers';
  
  const pinchDist = getPinchDistance(landmarks);
  if (pinchDist !== null) {
    if (pinchDist < 0.05) return 'pinch_close';
    if (pinchDist > 0.15) return 'pinch_open';
  }
  
  return 'none';
};
