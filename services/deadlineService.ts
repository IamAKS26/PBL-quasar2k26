import { Task, ProjectPhase } from '../types';

/**
 * Check if a task or phase is overdue
 */
export const isOverdue = (deadline?: number): boolean => {
    if (!deadline) return false;
    return Date.now() > deadline;
};

/**
 * Calculate time remaining until deadline
 * Returns formatted string like "2 days, 5 hours" or "Overdue by 3 days"
 */
export const calculateTimeRemaining = (deadline?: number): string => {
    if (!deadline) return 'No deadline';

    const now = Date.now();
    const diff = deadline - now;

    if (diff < 0) {
        // Overdue
        const daysPast = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
        const hoursPast = Math.floor((Math.abs(diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (daysPast > 0) {
            return `Overdue by ${daysPast} day${daysPast > 1 ? 's' : ''}`;
        } else if (hoursPast > 0) {
            return `Overdue by ${hoursPast} hour${hoursPast > 1 ? 's' : ''}`;
        } else {
            return 'Overdue';
        }
    }

    // Time remaining
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} min`;
    } else {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
};

/**
 * Get urgency level based on time remaining
 * Returns: 'high' (< 1 day), 'medium' (1-3 days), 'low' (> 3 days)
 */
export const getUrgencyLevel = (deadline?: number): 'high' | 'medium' | 'low' | 'overdue' | 'none' => {
    if (!deadline) return 'none';

    const now = Date.now();
    const diff = deadline - now;

    if (diff < 0) return 'overdue';

    const daysRemaining = diff / (1000 * 60 * 60 * 24);

    if (daysRemaining < 1) return 'high';
    if (daysRemaining < 3) return 'medium';
    return 'low';
};

/**
 * Get color class based on urgency
 */
export const getUrgencyColor = (deadline?: number): string => {
    const urgency = getUrgencyLevel(deadline);

    switch (urgency) {
        case 'overdue':
            return 'bg-red-100 text-red-700 border-red-200';
        case 'high':
            return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'medium':
            return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'low':
            return 'bg-green-100 text-green-700 border-green-200';
        default:
            return 'bg-slate-100 text-slate-500 border-slate-200';
    }
};

/**
 * Get tasks that are due within X days
 */
export const getUpcomingDeadlines = (tasks: Task[], daysAhead: number = 7): Task[] => {
    const now = Date.now();
    const futureThreshold = now + (daysAhead * 24 * 60 * 60 * 1000);

    return tasks.filter(task => {
        if (!task.deadline) return false;
        return task.deadline > now && task.deadline <= futureThreshold;
    }).sort((a, b) => (a.deadline || 0) - (b.deadline || 0));
};

/**
 * Get all overdue tasks
 */
export const getOverdueTasks = (tasks: Task[]): Task[] => {
    return tasks.filter(task => isOverdue(task.deadline) && !task.completed);
};

/**
 * Update overdue status for all tasks
 */
export const updateOverdueStatus = (tasks: Task[]): Task[] => {
    return tasks.map(task => ({
        ...task,
        isOverdue: isOverdue(task.deadline) && !task.completed,
    }));
};

/**
 * Format deadline for display
 */
export const formatDeadline = (deadline?: number): string => {
    if (!deadline) return 'No deadline set';

    const date = new Date(deadline);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isTomorrow) {
        return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: 'numeric',
        minute: '2-digit'
    });
};
