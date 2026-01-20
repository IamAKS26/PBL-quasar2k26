import { Group, Badge } from '../types';

export const BADGES: Badge[] = [
    { 
        id: 'first-step', 
        name: 'First Step', 
        icon: '🚀', 
        description: 'Complete your first task',
        color: 'bg-blue-100 text-blue-600'
    },
    { 
        id: 'momentum', 
        name: 'Momentum', 
        icon: '🔥', 
        description: 'Complete 3 tasks',
        color: 'bg-orange-100 text-orange-600'
    },
    { 
        id: 'phase-master', 
        name: 'Phase Master', 
        icon: '✨', 
        description: 'Complete a project phase',
        color: 'bg-purple-100 text-purple-600'
    },
    { 
        id: 'halfway', 
        name: 'Halfway There', 
        icon: '⛰️', 
        description: 'Reach 50% project completion',
        color: 'bg-teal-100 text-teal-600'
    },
    { 
        id: 'champion', 
        name: 'Champion', 
        icon: '🏆', 
        description: 'Complete the entire project',
        color: 'bg-yellow-100 text-yellow-600'
    },
];

export const XP_PER_TASK = 50;
export const XP_PER_PHASE = 500;

export const calculateXP = (group: Group): number => {
    if (!group.project) return 0;
    let xp = 0;
    group.project.phases.forEach(phase => {
        if (phase.status === 'completed') xp += XP_PER_PHASE;
        xp += phase.tasks.filter(t => t.completed).length * XP_PER_TASK;
    });
    return xp;
};

export const checkNewBadges = (group: Group, previousBadges: Badge[]): Badge[] => {
    if (!group.project) return [];
    
    const earnedBadges: Badge[] = [...previousBadges];
    const existingIds = new Set(previousBadges.map(b => b.id));

    const allTasks = group.project.phases.flatMap(p => p.tasks);
    const completedTasks = allTasks.filter(t => t.completed).length;
    const completedPhases = group.project.phases.filter(p => p.status === 'completed').length;
    const progress = completedTasks / (allTasks.length || 1);

    const award = (id: string) => {
        if (!existingIds.has(id)) {
            const b = BADGES.find(x => x.id === id);
            if (b) earnedBadges.push(b);
        }
    }

    if (completedTasks >= 1) award('first-step');
    if (completedTasks >= 3) award('momentum');
    if (completedPhases >= 1) award('phase-master');
    if (progress >= 0.5) award('halfway');
    if (progress >= 1) award('champion');

    // Return only the *newly* added badges for notification purposes if needed, 
    // but typically we want the full list for state. 
    // This function returns the FULL list of earned badges.
    return earnedBadges;
};
