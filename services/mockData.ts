import { Student, Project, ProjectPhase } from '../types';

const NAMES = [
  "Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Avery", "Quinn", "Skyler", "Dakota",
  "Reese", "Rowan", "Hayden", "Emerson", "Finley", "River", "Sawyer", "Phoenix", "Sage", "Cameron"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"
];

export const generateMockStudents = (count: number): Student[] => {
  return Array.from({ length: count }).map((_, i) => {
    const math = Math.floor(Math.random() * 40) + 60; // 60-100
    const science = Math.floor(Math.random() * 40) + 60;
    const creativity = Math.floor(Math.random() * 40) + 60;
    const leadership = Math.floor(Math.random() * 40) + 60;

    const avg = (math + science + creativity + leadership) / 4;

    return {
      id: `student-${i}`,
      name: `${NAMES[i % NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`,
      avatar: `https://picsum.photos/seed/${i + 123}/150/150`,
      scores: { math, science, creativity, leadership },
      averageScore: parseFloat(avg.toFixed(1)),
      personalXP: 0,
      personalBadges: [],
      activityLog: [],
      joinedAt: Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
    };
  });
};

export const generateMockProject = async (topic: string): Promise<Project> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const phases: ProjectPhase[] = [
    {
      id: 'phase-0',
      title: 'Entry Event & Driving Question',
      description: 'Kickoff the project with an engaging event and form the central question.',
      status: 'active',
      tasks: [
        { id: 'task-0-0', title: 'Analyze the project scenario', completed: false },
        { id: 'task-0-1', title: 'Brainstorm initial questions', completed: false },
        { id: 'task-0-2', title: 'Define the Driving Question', completed: false }
      ]
    },
    {
      id: 'phase-1',
      title: 'Inquiry & Innovation',
      description: 'Conduct research and explore existing solutions.',
      status: 'locked',
      tasks: [
        { id: 'task-1-0', title: 'Assign research roles', completed: false },
        { id: 'task-1-1', title: 'Gather data and resources', completed: false },
        { id: 'task-1-2', title: 'Identify constraints and criteria', completed: false }
      ]
    },
    {
      id: 'phase-2',
      title: 'Creation & Prototyping',
      description: 'Build the solution or prototype.',
      status: 'locked',
      tasks: [
        { id: 'task-2-0', title: 'Design the solution', completed: false },
        { id: 'task-2-1', title: 'Develop the prototype', completed: false },
        { id: 'task-2-2', title: 'Test and iterate', completed: false }
      ]
    },
    {
      id: 'phase-3',
      title: 'Presentation & Reflection',
      description: 'Present findings and reflect on the learning process.',
      status: 'locked',
      tasks: [
        { id: 'task-3-0', title: 'Prepare the presentation', completed: false },
        { id: 'task-3-1', title: 'Deliver final pitch', completed: false },
        { id: 'task-3-2', title: 'Complete reflection journal', completed: false }
      ]
    }
  ];

  return {
    topic,
    drivingQuestion: `How can we solve challenges related to ${topic}?`,
    description: `A comprehensive project-based learning experience exploring ${topic}. Teams will research, design, and present innovative solutions.`,
    phases,
    resources: [
      { title: 'Project Guide', uri: 'https://example.com/guide' },
      { title: 'Research Template', uri: 'https://example.com/template' }
    ]
  };
};
