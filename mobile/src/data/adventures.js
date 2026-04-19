export const ADVENTURE_POINTS = {
  'penny-hike': 5,
  'find-the-nature': 8,
};

export const PENNY_HIKE = {
  id: 'penny-hike',
  title: 'The Penny Hike',
  desc: 'Flip a coin at every crossroad. Heads right, tails left. 30 minutes of pure chaos.',
  summary: 'No map. No plan. Every time you hit a crossroad, flip the coin — heads means right, tails means left. Walk for 30 minutes and see where you end up.',
  duration: '30 min',
  distance: '???',
  location: 'Wherever chaos takes you',
  tag: 'Chaos',
  img: require('../../assets/scene-campfire.jpg'),
  hero: require('../../assets/scene-campfire.jpg'),
  sections: [
    { emoji: '🪙', label: "How it works", body: "At every crossroad, tap the coin below. Heads = go right. Tails = go left. No overriding the flip. Walk for 30 minutes, then find your way back." },
    { emoji: '👥', label: "Best with", body: "2–4 friends. The more opinions you ignore, the better.", chips: ['Social', 'Chaos'] },
    { emoji: '🎒', label: "What to bring", body: "Charged phone for the way back, comfortable shoes, a snack for wherever you end up." },
    { emoji: '🛡', label: "Stay safe", body: "Share your location with someone. Stick to public streets. Set a 30-minute timer before you start." },
  ],
};

export const FIND_NATURE = {
  id: 'find-the-nature',
  title: 'Find the Nature',
  desc: 'Go around your local area and take 5 pictures of different plants.',
  summary: 'Step outside and look closer. Explore your local area and photograph 5 different plants you find — flowers, trees, shrubs, moss, anything that grows. Each one must be a different species.',
  duration: '45 min',
  distance: '1–2 km',
  location: 'Your local area',
  tag: 'Survivalist',
  img: require('../../assets/scene-forest.jpg'),
  hero: require('../../assets/scene-forest.jpg'),
  sections: [
    { emoji: '🌿', label: "What you'll do", body: "Walk around your neighbourhood or a nearby green area. Find and photograph 5 different plant species. Upload each photo — the app will verify it's a plant." },
    { emoji: '🔍', label: "Focus", body: "Nature observation · Identification · Mindful walking", chips: ['Survivalist', 'Nature'] },
    { emoji: '🎒', label: "What to bring", body: "Your phone with camera, comfortable shoes, curiosity. Optionally a field guide or plant ID app." },
    { emoji: '🛡', label: "Stay safe", body: "Don't pick or touch unknown plants. Stick to public areas. Let someone know where you're going." },
  ],
};
