import { v4 as uuidv4 } from 'uuid';

type Objective = {
  id: string;
  text: string;
  completed: boolean;
};

type Question = {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
};

type Hint = {
  id: string;
  x: number; // Percentage of width (0-100)
  y: number; // Percentage of height (0-100)
  content: string;
  title?: string;
  type: 'fact' | 'hint' | 'tip';
};

type LearningPack = {
  id: string;
  title: string;
  description: string;
  objectives: Objective[];
  questions: Question[];
  hints: Hint[];
  thumbnailUrl: string;
  backgroundImage: string;
};

// Generate default objectives for a pack
const createDefaultObjectives = (packId: string, objectivesText: string[]): Objective[] => {
  return objectivesText.map((text, index) => ({
    id: `${packId}-obj-${index + 1}`,
    text,
    completed: false,
  }));
};

// Generate default questions for a pack
const createDefaultQuestions = (packId: string, questionsData: Array<{
  text: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  explanation?: string;
}>): Question[] => {
  return questionsData.map((q, qIndex) => ({
    id: `${packId}-q-${qIndex + 1}`,
    text: q.text,
    options: q.options.map((opt, optIndex) => ({
      id: String.fromCharCode(97 + optIndex), // a, b, c, d
      text: opt.text,
      isCorrect: opt.isCorrect,
    })),
    explanation: q.explanation,
  }));
};

// Generate default hints for a pack
const createDefaultHints = (packId: string, hintsData: Array<{
  x: number;
  y: number;
  content: string;
  title?: string;
  type?: 'fact' | 'hint' | 'tip';
}>): Hint[] => {
  return hintsData.map((hint, index) => ({
    id: `${packId}-hint-${index + 1}`,
    x: hint.x,
    y: hint.y,
    content: hint.content,
    title: hint.title,
    type: hint.type || 'fact',
  }));
};

// Ocean Life Pack
export const OCEAN_LIFE_PACK: LearningPack = {
  id: 'ocean-life',
  title: 'Ocean Life',
  description: 'Explore the wonders of the deep blue sea and its fascinating creatures.',
  thumbnailUrl: '/packs/ocean-life/thumbnail.svg',
  backgroundImage: '/packs/ocean-life/background.svg',
  objectives: createDefaultObjectives('ocean-life', [
    'Identify different ocean zones and their characteristics',
    'Understand the importance of coral reefs to marine ecosystems',
    'Learn about common marine species and their habitats',
    'Color the coral reef scene using appropriate colors',
  ]),
  questions: createDefaultQuestions('ocean-life', [
    {
      text: 'Which ocean zone receives the most sunlight?',
      options: [
        { text: 'Sunlit Zone', isCorrect: true },
        { text: 'Twilight Zone', isCorrect: false },
        { text: 'Midnight Zone', isCorrect: false },
        { text: 'Abyssal Zone', isCorrect: false },
      ],
      explanation: 'The sunlit zone (or euphotic zone) receives the most sunlight and is where most marine life is found.',
    },
    {
      text: 'What is the primary source of energy for coral reefs?',
      options: [
        { text: 'Sunlight', isCorrect: true },
        { text: 'Hydrothermal vents', isCorrect: false },
        { text: 'Underwater volcanoes', isCorrect: false },
        { text: 'Ocean currents', isCorrect: false },
      ],
      explanation: 'Coral reefs depend on sunlight because the algae (zooxanthellae) living in their tissues need it for photosynthesis.',
    },
    {
      text: 'Which of these is NOT a threat to coral reefs?',
      options: [
        { text: 'Ocean acidification', isCorrect: false },
        { text: 'Overfishing', isCorrect: false },
        { text: 'Moon phases', isCorrect: true },
        { text: 'Pollution', isCorrect: false },
      ],
      explanation: 'While ocean acidification, overfishing, and pollution are major threats to coral reefs, moon phases are a natural phenomenon that doesn\'t harm them.',
    },
  ]),
  hints: createDefaultHints('ocean-life', [
    {
      x: 30,
      y: 40,
      title: 'Coral Polyps',
      content: 'These tiny animals build the coral reef by secreting calcium carbonate to form a hard skeleton.',
      type: 'fact',
    },
    {
      x: 60,
      y: 30,
      title: 'Color Tip',
      content: 'Coral comes in many colors, not just the orange-pink you might expect. Try using different shades for variety!',
      type: 'tip',
    },
    {
      x: 70,
      y: 60,
      title: 'Marine Life',
      content: 'The ocean is home to about 1 million known species, but scientists estimate there could be up to 9 million more we haven\'t discovered yet!',
      type: 'fact',
    },
  ]),
};

// Dinosaur World Pack
export const DINOSAUR_WORLD_PACK: LearningPack = {
  id: 'dinosaur-world',
  title: 'Dinosaur World',
  description: 'Travel back in time to the age of dinosaurs and learn about these magnificent creatures.',
  thumbnailUrl: '/packs/dinosaur-world/thumbnail.svg',
  backgroundImage: '/packs/dinosaur-world/background.svg',
  objectives: createDefaultObjectives('dinosaur-world', [
    'Identify different types of dinosaurs and their characteristics',
    'Understand the Mesozoic Era and its three periods',
    'Learn about dinosaur habitats and behaviors',
    'Color the prehistoric scene with accurate or creative colors',
  ]),
  questions: createDefaultQuestions('dinosaur-world', [
    {
      text: 'Which period is known as the "Age of Dinosaurs"?',
      options: [
        { text: 'Cenozoic', isCorrect: false },
        { text: 'Mesozoic', isCorrect: true },
        { text: 'Paleozoic', isCorrect: false },
        { text: 'Precambrian', isCorrect: false },
      ],
      explanation: 'The Mesozoic Era (252 to 66 million years ago) is often called the "Age of Dinosaurs" because dinosaurs were the dominant land animals during this time.',
    },
    {
      text: 'Which of these dinosaurs was a herbivore?',
      options: [
        { text: 'Tyrannosaurus rex', isCorrect: false },
        { text: 'Velociraptor', isCorrect: false },
        { text: 'Triceratops', isCorrect: true },
        { text: 'Spinosaurus', isCorrect: false },
      ],
      explanation: 'Triceratops was a herbivore, meaning it only ate plants. The other options were carnivorous dinosaurs.',
    },
    {
      text: 'What event is believed to have caused the mass extinction of dinosaurs?',
      options: [
        { text: 'Asteroid impact', isCorrect: true },
        { text: 'Volcanic eruptions', isCorrect: false },
        { text: 'Ice age', isCorrect: false },
        { text: 'Disease', isCorrect: false },
      ],
      explanation: 'The most widely accepted theory is that a massive asteroid impact caused dramatic climate changes that led to the extinction of non-avian dinosaurs.',
    },
  ]),
  hints: createDefaultHints('dinosaur-world', [
    {
      x: 40,
      y: 50,
      title: 'Dinosaur Colors',
      content: 'Scientists believe some dinosaurs may have had colorful feathers! Feel free to use your imagination when coloring.',
      type: 'tip',
    },
    {
      x: 60,
      y: 30,
      title: 'Fun Fact',
      content: 'The word "dinosaur" means "terrible lizard" in Greek, but dinosaurs are actually a separate group from lizards.',
      type: 'fact',
    },
    {
      x: 70,
      y: 60,
      title: 'Dinosaur Sizes',
      content: 'Dinosaurs came in all sizes, from the chicken-sized Compsognathus to the massive Argentinosaurus, which was over 100 feet long!',
      type: 'fact',
    },
  ]),
};

// Space Exploration Pack
export const SPACE_EXPLORATION_PACK: LearningPack = {
  id: 'space-exploration',
  title: 'Space Exploration',
  description: 'Blast off into the cosmos and learn about our solar system and beyond!',
  thumbnailUrl: '/packs/space-exploration/thumbnail.svg',
  backgroundImage: '/packs/space-exploration/background.svg',
  objectives: createDefaultObjectives('space-exploration', [
    'Identify the planets in our solar system and their key features',
    'Understand the concept of space exploration and its importance',
    'Learn about famous space missions and astronauts',
    'Color the space scene with accurate or imaginative colors',
  ]),
  questions: createDefaultQuestions('space-exploration', [
    {
      text: 'Which planet is known as the "Red Planet"?',
      options: [
        { text: 'Venus', isCorrect: false },
        { text: 'Mars', isCorrect: true },
        { text: 'Jupiter', isCorrect: false },
        { text: 'Saturn', isCorrect: false },
      ],
      explanation: 'Mars is often called the "Red Planet" because iron minerals in the Martian soil oxidize, or rust, causing the soil and atmosphere to look red.',
    },
    {
      text: 'What was the name of the first human to orbit Earth?',
      options: [
        { text: 'Neil Armstrong', isCorrect: false },
        { text: 'Yuri Gagarin', isCorrect: true },
        { text: 'Alan Shepard', isCorrect: false },
        { text: 'John Glenn', isCorrect: false },
      ],
      explanation: 'Yuri Gagarin, a Soviet cosmonaut, became the first human to journey into outer space on April 12, 1961.',
    },
    {
      text: 'Which of these is NOT a type of galaxy?',
      options: [
        { text: 'Spiral', isCorrect: false },
        { text: 'Elliptical', isCorrect: false },
        { text: 'Irregular', isCorrect: false },
        { text: 'Triangular', isCorrect: true },
      ],
      explanation: 'The main types of galaxies are spiral, elliptical, and irregular. There is no "triangular" galaxy classification.',
    },
  ]),
  hints: createDefaultHints('space-exploration', [
    {
      x: 30,
      y: 40,
      title: 'Space Colors',
      content: 'Space isn\'t completely black! Nebulas can appear in beautiful colors like red, blue, and purple due to different gases.',
      type: 'tip',
    },
    {
      x: 60,
      y: 30,
      title: 'Fun Fact',
      content: 'A day on Venus is longer than a year on Venus! It takes 243 Earth days to rotate once but only 225 Earth days to orbit the Sun.',
      type: 'fact',
    },
    {
      x: 70,
      y: 60,
      title: 'Space Exploration',
      content: 'The first artificial satellite, Sputnik 1, was launched by the Soviet Union in 1957, marking the beginning of the space age.',
      type: 'fact',
    },
  ]),
};

// Jungle Safari Pack
export const JUNGLE_SAFARI_PACK: LearningPack = {
  id: 'jungle-safari',
  title: 'Jungle Safari',
  description: 'Venture into the dense jungle and discover the amazing animals that call it home.',
  thumbnailUrl: '/packs/jungle-safari/thumbnail.svg',
  backgroundImage: '/packs/jungle-safari/background.svg',
  objectives: createDefaultObjectives('jungle-safari', [
    'Identify different jungle animals and their adaptations',
    'Understand the importance of rainforests to the planet',
    'Learn about the different layers of the rainforest',
    'Color the jungle scene with vibrant, natural colors',
  ]),
  questions: createDefaultQuestions('jungle-safari', [
    {
      text: 'Which of these is the largest rainforest in the world?',
      options: [
        { text: 'Congo Rainforest', isCorrect: false },
        { text: 'Amazon Rainforest', isCorrect: true },
        { text: 'Daintree Rainforest', isCorrect: false },
        { text: 'Southeast Asian Rainforest', isCorrect: false },
      ],
      explanation: 'The Amazon Rainforest is the largest rainforest in the world, covering approximately 5.5 million square kilometers across nine countries in South America.',
    },
    {
      text: 'What percentage of the world\'s species are estimated to live in rainforests?',
      options: [
        { text: '10%', isCorrect: false },
        { text: '30%', isCorrect: false },
        { text: '50%', isCorrect: true },
        { text: '70%', isCorrect: false },
      ],
      explanation: 'Rainforests are incredibly biodiverse, with an estimated 50% of the world\'s species living in these ecosystems, despite covering only about 6% of the Earth\'s land surface.',
    },
    {
      text: 'Which of these animals is NOT typically found in a jungle/rainforest?',
      options: [
        { text: 'Jaguar', isCorrect: false },
        { text: 'Toucan', isCorrect: false },
        { text: 'Polar Bear', isCorrect: true },
        { text: 'Poison Dart Frog', isCorrect: false },
      ],
      explanation: 'Polar bears live in the Arctic, which is the complete opposite of a jungle or rainforest environment.',
    },
  ]),
  hints: createDefaultHints('jungle-safari', [
    {
      x: 40,
      y: 50,
      title: 'Rainforest Layers',
      content: 'Rainforests have four main layers: emergent, canopy, understory, and forest floor. Each layer has its own unique plants and animals!',
      type: 'fact',
    },
    {
      x: 60,
      y: 30,
      title: 'Color Tip',
      content: 'Jungles are full of vibrant colors! Don\'t be afraid to use bright greens, blues, and yellows to make your jungle scene come alive.',
      type: 'tip',
    },
    {
      x: 70,
      y: 60,
      title: 'Did You Know?',
      content: 'The Amazon Rainforest produces about 20% of the world\'s oxygen, earning it the nickname "the lungs of the Earth."',
      type: 'fact',
    },
  ]),
};

// Export all packs as an array
export const ALL_PACKS: LearningPack[] = [
  OCEAN_LIFE_PACK,
  DINOSAUR_WORLD_PACK,
  SPACE_EXPLORATION_PACK,
  JUNGLE_SAFARI_PACK,
];

// Helper function to get a pack by ID
export const getPackById = (id: string): LearningPack | undefined => {
  return ALL_PACKS.find(pack => pack.id === id);
};

// Helper function to get a random pack
export const getRandomPack = (): LearningPack => {
  const randomIndex = Math.floor(Math.random() * ALL_PACKS.length);
  return ALL_PACKS[randomIndex];
};

// Helper function to create a new custom pack
export const createCustomPack = (data: Partial<LearningPack> & { title: string }): LearningPack => {
  const packId = data.id || `custom-${uuidv4()}`;
  
  return {
    id: packId,
    title: data.title,
    description: data.description || 'A custom learning pack',
    thumbnailUrl: data.thumbnailUrl || '/packs/default/thumbnail.svg',
    backgroundImage: data.backgroundImage || '/packs/default/background.svg',
    objectives: data.objectives || createDefaultObjectives(packId, ['Complete the activities in this pack']),
    questions: data.questions || [],
    hints: data.hints || [],
  };
};
