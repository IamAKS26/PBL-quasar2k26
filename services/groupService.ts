import { Student, Group } from '../types';

export const formBalancedGroups = (students: Student[], groupSize: number = 4): Group[] => {
  // Simple snake draft algorithm based on average score to balance total "power" per team
  
  // 1. Sort students by average score descending
  const sortedStudents = [...students].sort((a, b) => b.averageScore - a.averageScore);
  
  const numberOfGroups = Math.ceil(students.length / groupSize);
  const groups: Group[] = Array.from({ length: numberOfGroups }).map((_, i) => ({
    id: `group-${i}`,
    name: `Team ${String.fromCharCode(65 + i)}`, // Team A, B, C...
    members: [],
    progress: 0,
    xp: 0,
    badges: []
  }));

  // 2. Distribute in snake order
  // 0, 1, 2, 3 ... 3, 2, 1, 0 ...
  
  let groupIndex = 0;
  let direction = 1; // 1 for forward, -1 for backward

  sortedStudents.forEach((student) => {
    groups[groupIndex].members.push(student);
    
    groupIndex += direction;
    
    // Boundary checks
    if (groupIndex >= numberOfGroups) {
      groupIndex = numberOfGroups - 1;
      direction = -1;
    } else if (groupIndex < 0) {
      groupIndex = 0;
      direction = 1;
    }
  });

  return groups;
};
