export const ADVENTURE_POINTS = {
  'penny-hike':          5,
  'find-the-nature':     8,
  'social-flash-mob':    6,
  'stranger-compliment': 7,
  'sunrise-patrol':      9,
  'wild-sit-spot':       5,
  'urban-safari':        8,
  'coffee-roulette':     6,
};

// ─── Social Chaos ─────────────────────────────────────────────────────────────

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

export const SOCIAL_FLASH_MOB = {
  id: 'social-flash-mob',
  title: 'Invisible Orchestra',
  desc: 'Conduct an invisible orchestra in a public space for 5 minutes. See who reacts.',
  summary: 'Walk into a public space — a plaza, a park, a bus stop. Start conducting an invisible orchestra. Go full maestro: both arms, dramatic pauses, the works. Hold it for 5 minutes and observe the world around you.',
  duration: '20 min',
  distance: '0.5 km',
  location: 'Any public square',
  tag: 'Social',
  img: require('../../assets/scene-hills.jpg'),
  hero: require('../../assets/scene-hills.jpg'),
  sections: [
    { emoji: '🎼', label: "How it works", body: "Find a busy public spot. Pick an imaginary piece of music. Conduct it with full commitment — both hands, dynamics, the whole show. 5 minutes minimum." },
    { emoji: '👥', label: "Best with", body: "Solo is braver. With friends, take turns. One conducts, others watch and record reactions.", chips: ['Social', 'Chaos'] },
    { emoji: '😐', label: "The challenge", body: "The hardest part isn't starting — it's not stopping when people stare. Hold the commitment. That's the whole game." },
    { emoji: '🛡', label: "Stay aware", body: "Stick to open public spaces. Stop if asked by staff. Keep your phone accessible." },
  ],
};

export const STRANGER_COMPLIMENT = {
  id: 'stranger-compliment',
  title: 'Compliment Run',
  desc: 'Give 5 genuine compliments to 5 different strangers in 30 minutes.',
  summary: 'Head out with one mission: find 5 strangers and give each a genuine, specific compliment. Not "nice shoes." Something real. Something you actually notice. No cringe, no flirting — just honest human connection.',
  duration: '30 min',
  distance: '1 km',
  location: 'Town centre',
  tag: 'Chaos',
  img: require('../../assets/scene-river.jpg'),
  hero: require('../../assets/scene-river.jpg'),
  sections: [
    { emoji: '💬', label: "The rules", body: "5 different strangers. Each compliment must be specific and genuine — about what you actually notice. Not generic. Not flattery." },
    { emoji: '🧠', label: "Why it works", body: "Studies show both giver and receiver of compliments get a mood boost. You're basically handing out free serotonin.", chips: ['Social', 'Chaos'] },
    { emoji: '✨', label: "What works", body: "Compliment effort, not appearance. 'That looks like a great book' beats 'nice outfit'. Notice real things." },
    { emoji: '🛡', label: "Stay safe", body: "Keep it public. If someone seems uncomfortable, move on immediately. No following." },
  ],
};

// ─── Survivalist ──────────────────────────────────────────────────────────────

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

export const SUNRISE_PATROL = {
  id: 'sunrise-patrol',
  title: 'Sunrise Patrol',
  desc: 'Find the highest accessible point near you and watch the city wake up at dawn.',
  summary: 'Set your alarm before sunrise. Find the highest point you can reach on foot — a hill, a rooftop car park, a bridge. Get there before the sun crests and stay through the full colour change of the sky.',
  duration: '60 min',
  distance: '2–3 km',
  location: 'Your city',
  tag: 'Nature',
  img: require('../../assets/scene-river.jpg'),
  hero: require('../../assets/scene-river.jpg'),
  sections: [
    { emoji: '🌅', label: "The mission", body: "Find elevation. Be there before the sun rises. Stay until the sky fully transitions from dark to light. No headphones — just the city waking up." },
    { emoji: '🧭', label: "Find your spot", body: "Parks with hills, car park rooftops, bridges, church steps, any legal high ground in your area.", chips: ['Survivalist', 'Nature'] },
    { emoji: '🎒', label: "What to bring", body: "Warm layers — mornings are cold. A thermos. Charged phone. Tell someone where you're going the night before." },
    { emoji: '🛡', label: "Stay safe", body: "Plan your route in daylight beforehand. Avoid isolated spots at night. Stick to publicly accessible high ground." },
  ],
};

export const WILD_SIT_SPOT = {
  id: 'wild-sit-spot',
  title: 'The Sit Spot',
  desc: 'Find a patch of nature. Sit perfectly still for 20 minutes. No phone. Just listen.',
  summary: 'Walk into any green space and find a spot that feels right. Sit completely still for 20 minutes. No scrolling, no music — just you and whatever is around you. Count every distinct sound you can hear.',
  duration: '25 min',
  distance: '0.5 km',
  location: 'Any park or green space',
  tag: 'Nature',
  img: require('../../assets/scene-hills.jpg'),
  hero: require('../../assets/scene-hills.jpg'),
  sections: [
    { emoji: '🤫', label: "How it works", body: "Find a green space. Sit in one spot without moving for 20 full minutes. Count every distinct sound — wind, birds, distant traffic, footsteps. Aim for 10+." },
    { emoji: '🧬', label: "The science", body: "20 minutes in nature measurably drops cortisol levels. This is one of the simplest, most evidence-backed stress resets that exists.", chips: ['Survivalist', 'Nature'] },
    { emoji: '🎒', label: "What to bring", body: "Nothing you'll be tempted to look at. A blanket or something to sit on. Maybe a small notebook." },
    { emoji: '💡', label: "Tips", body: "The first 5 minutes will feel restless. Push through. The second 5 minutes is where it starts to shift. Minute 15 is usually remarkable." },
  ],
};

// ─── Urban Explore ────────────────────────────────────────────────────────────

export const URBAN_SAFARI = {
  id: 'urban-safari',
  title: 'Urban Safari',
  desc: 'Photograph 8 signs of human creativity hidden in plain sight — murals, stickers, odd architecture.',
  summary: 'Your city is full of art and weirdness that most people walk straight past. Your mission: photograph 8 examples of human creativity in unexpected places. Stickers, murals, chalk, architectural oddities, beautiful decay.',
  duration: '45 min',
  distance: '1–2 km',
  location: 'City centre',
  tag: 'Urban',
  img: require('../../assets/scene-campfire.jpg'),
  hero: require('../../assets/scene-campfire.jpg'),
  sections: [
    { emoji: '📸', label: "What to find", body: "Street art, paste-ups, stickers, chalk drawings, odd signs, worn-down paint that accidentally looks like something, strange architecture details — anything made by a human with intention." },
    { emoji: '🗺', label: "Focus", body: "Visual literacy · Urban observation · Creative documentation", chips: ['Urban', 'Discovery'] },
    { emoji: '🎒', label: "What to bring", body: "Your phone with a good camera. Comfortable walking shoes. Curiosity about surfaces you've ignored your whole life." },
    { emoji: '🛡', label: "Stay aware", body: "Photograph from public ground only. No trespassing. Be aware of traffic when you stop to look up." },
  ],
};

export const COFFEE_ROULETTE = {
  id: 'coffee-roulette',
  title: 'Coffee Roulette',
  desc: 'Walk in a random direction for 10 minutes and enter the first café you see. Order something you\'ve never tried.',
  summary: 'No Google Maps. No reviews. Walk in any direction for exactly 10 minutes, then enter the first café or bar you see. Order one thing you have never ordered before. Stay for at least 15 minutes without looking at your phone.',
  duration: '35 min',
  distance: '1 km',
  location: 'Your neighbourhood',
  tag: 'Urban',
  img: require('../../assets/scene-forest.jpg'),
  hero: require('../../assets/scene-forest.jpg'),
  sections: [
    { emoji: '☕', label: "The rules", body: "Walk 10 minutes in any direction. Enter the first café you see. Order something you've never had. Stay 15 minutes without your phone. That's it." },
    { emoji: '🎲', label: "Why random?", body: "Removing choice removes anxiety. You're not picking wrong. There is no wrong. You're practising the rare skill of being comfortable with whatever comes.", chips: ['Urban', 'Discovery'] },
    { emoji: '🍵', label: "What to order", body: "Ask the barista what they'd recommend. Or point at something unfamiliar on the menu. Bonus points for ordering in the local language." },
    { emoji: '🌱', label: "Stay open", body: "Sit facing the room. Notice two things about the space you'd never have noticed if you'd planned to be there." },
  ],
};

// ─── Lookup map ───────────────────────────────────────────────────────────────

export const ADVENTURE_MAP = {
  'penny-hike':          PENNY_HIKE,
  'find-the-nature':     FIND_NATURE,
  'social-flash-mob':    SOCIAL_FLASH_MOB,
  'stranger-compliment': STRANGER_COMPLIMENT,
  'sunrise-patrol':      SUNRISE_PATROL,
  'wild-sit-spot':       WILD_SIT_SPOT,
  'urban-safari':        URBAN_SAFARI,
  'coffee-roulette':     COFFEE_ROULETTE,
};
