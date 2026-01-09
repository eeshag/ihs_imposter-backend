// IHS-themed word lists

const classes = [
  'AP Calculus',
  'AP Biology',
  'AP English',
  'AP Chemistry',
  'AP Physics',
  'AP History',
  'Computer Science',
  'Spanish',
  'French',
  'Art',
  'Band',
  'Choir',
  'PE',
  'Library',
  'Study Hall'
];

const teachers = [
  'Principal',
  'Vice Principal',
  'Math Teacher',
  'Science Teacher',
  'English Teacher',
  'History Teacher',
  'Gym Teacher',
  'Music Teacher',
  'Art Teacher',
  'Counselor',
  'Librarian',
  'Lunch Lady',
  'Janitor',
  'Security Guard',
  'Substitute Teacher'
];

const locations = [
  'Cafeteria',
  'Library',
  'Gymnasium',
  'Auditorium',
  'Parking Lot',
  'Football Field',
  'Basketball Court',
  'Main Office',
  'Nurse Office',
  'Bathroom',
  'Hallway',
  'Stairwell',
  'Locker Room',
  'Science Lab',
  'Computer Lab',
  'Art Room',
  'Music Room',
  'Detention',
  'Principal Office',
  'Student Parking'
];

const clubsAndSports = [
  'Football Team',
  'Basketball Team',
  'Soccer Team',
  'Tennis Team',
  'Swimming Team',
  'Chess Club',
  'Debate Team',
  'Robotics Club',
  'Student Council',
  'Yearbook Committee',
  'Newspaper Club',
  'Drama Club',
  'Music Band',
  'Cheerleading',
  'Track and Field',
  'Baseball Team',
  'Volleyball Team',
  'Photography Club',
  'Science Club',
  'Math Team'
];

// Combine all word lists
const allWords = [
  ...classes,
  ...teachers,
  ...locations,
  ...clubsAndSports
];

// Generate a random word
function generateWord() {
  return allWords[Math.floor(Math.random() * allWords.length)];
}

// Generate hints (1-word hints for imposters)
// This is a simplified version - in a real game, you might want more sophisticated hint generation
function getHints(word) {
  // Simple hint generation: return words from the same category that are similar
  // For now, return 3-5 random words from the same category as the actual word
  let category = [];
  
  if (classes.includes(word)) category = classes.filter(w => w !== word);
  else if (teachers.includes(word)) category = teachers.filter(w => w !== word);
  else if (locations.includes(word)) category = locations.filter(w => w !== word);
  else if (clubsAndSports.includes(word)) category = clubsAndSports.filter(w => w !== word);
  else category = allWords.filter(w => w !== word);

  // Return 3-5 random hints
  const numHints = Math.min(5, category.length);
  const shuffled = category.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numHints);
}

module.exports = {
  generateWord,
  getHints,
  allWords,
  classes,
  teachers,
  locations,
  clubsAndSports
};


