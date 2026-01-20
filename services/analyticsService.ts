import { Group, Student, StudentAnalytics, Task, ProjectPhase } from '../types';

/**
 * Calculate individual student contribution within their group
 * Based on tasks completed, submission quality, and activity
 */
export const calculateStudentContribution = (
    student: Student,
    group: Group
): number => {
    if (!group.project) return 0;

    const allTasks = group.project.phases.flatMap(p => p.tasks);
    const totalTasks = allTasks.length;

    if (totalTasks === 0) return 0;

    // Calculate student's completed tasks (simplified - in real app, track per student)
    const studentTasksCompleted = student.activityLog.filter(
        log => log.action === 'task_completed'
    ).length;

    // Calculate contribution percentage
    const contributionScore = Math.min(100, (studentTasksCompleted / totalTasks) * 100);

    return Math.round(contributionScore);
};

/**
 * Calculate time spent by student (based on activity logs)
 */
export const calculateTimeSpent = (student: Student): number => {
    const logs = student.activityLog;
    if (logs.length < 2) return 0;

    // Simple estimation: time between first and last activity
    const firstActivity = logs[0]?.timestamp || Date.now();
    const lastActivity = logs[logs.length - 1]?.timestamp || Date.now();

    const timeSpentMs = lastActivity - firstActivity;
    const timeSpentMinutes = Math.floor(timeSpentMs / (1000 * 60));

    return timeSpentMinutes;
};

/**
 * Calculate average submission quality based on rubric scores
 */
export const calculateSubmissionQuality = (student: Student, group: Group): number => {
    if (!group.project) return 0;

    const allTasks = group.project.phases.flatMap(p => p.tasks);
    const submissionsWithScores = allTasks.filter(
        task => task.submission?.feedback?.rubricScore !== undefined
    );

    if (submissionsWithScores.length === 0) return 0;

    const totalScore = submissionsWithScores.reduce((sum, task) => {
        const score = task.submission?.feedback?.rubricScore || 0;
        const maxScore = task.rubric?.maxScore || 100;
        return sum + (score / maxScore) * 100;
    }, 0);

    return Math.round(totalScore / submissionsWithScores.length);
};

/**
 * Get comprehensive analytics for a student
 */
export const getStudentAnalytics = (
    student: Student,
    group: Group
): StudentAnalytics => {
    const tasksCompleted = student.activityLog.filter(
        log => log.action === 'task_completed'
    ).length;

    const allTasks = group.project?.phases.flatMap(p => p.tasks) || [];
    const pendingTasks = allTasks.filter(
        task => !task.completed && task.submission?.status === 'pending'
    ).length;

    const overdueTasksCount = allTasks.filter(
        task => !task.completed && task.deadline && task.deadline < Date.now()
    ).length;

    const lastActivity = student.activityLog.length > 0
        ? student.activityLog[student.activityLog.length - 1].timestamp
        : student.joinedAt;

    return {
        studentId: student.id,
        groupId: group.id,
        tasksCompleted,
        timeSpent: calculateTimeSpent(student),
        submissionQuality: calculateSubmissionQuality(student, group),
        contributionScore: calculateStudentContribution(student, group),
        lastActive: lastActivity,
        pendingTasks,
        overdueTasksCount,
    };
};

/**
 * Get analytics for all students across all groups
 */
export const getAllStudentsAnalytics = (groups: Group[]): StudentAnalytics[] => {
    const analytics: StudentAnalytics[] = [];

    groups.forEach(group => {
        group.members.forEach(student => {
            analytics.push(getStudentAnalytics(student, group));
        });
    });

    return analytics;
};

/**
 * Detect students who are stuck (pending tasks for > 3 days)
 */
export const detectStuckStudents = (
    groups: Group[],
    daysThreshold: number = 3
): StudentAnalytics[] => {
    const allAnalytics = getAllStudentsAnalytics(groups);
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;
    const now = Date.now();

    return allAnalytics.filter(analytics => {
        const daysSinceActive = (now - analytics.lastActive) / (24 * 60 * 60 * 1000);
        return analytics.pendingTasks > 0 && daysSinceActive > daysThreshold;
    });
};

/**
 * Get class-wide metrics
 */
export const getClassWideMetrics = (groups: Group[]) => {
    const allStudents = groups.flatMap(g => g.members);
    const allAnalytics = getAllStudentsAnalytics(groups);

    const totalStudents = allStudents.length;
    const averageProgress = groups.reduce((sum, g) => sum + g.progress, 0) / groups.length;
    const totalTasksCompleted = allAnalytics.reduce((sum, a) => sum + a.tasksCompleted, 0);
    const averageSubmissionQuality = allAnalytics.reduce((sum, a) => sum + a.submissionQuality, 0) / totalStudents;
    const stuckStudentsCount = detectStuckStudents(groups).length;

    const allTasks = groups.flatMap(g => g.project?.phases.flatMap(p => p.tasks) || []);
    const pendingSubmissions = allTasks.filter(t => t.submission?.status === 'pending').length;
    const approvedSubmissions = allTasks.filter(t => t.submission?.status === 'approved').length;
    const rejectedSubmissions = allTasks.filter(t => t.submission?.status === 'rejected').length;
    const needsRevisionSubmissions = allTasks.filter(t => t.submission?.status === 'needs_revision').length;

    return {
        totalStudents,
        totalGroups: groups.length,
        averageProgress: Math.round(averageProgress),
        totalTasksCompleted,
        averageSubmissionQuality: Math.round(averageSubmissionQuality),
        stuckStudentsCount,
        submissionStats: {
            pending: pendingSubmissions,
            approved: approvedSubmissions,
            rejected: rejectedSubmissions,
            needsRevision: needsRevisionSubmissions,
        },
    };
};

/**
 * Export data to CSV format
 */
export const exportToCSV = (groups: Group[]): string => {
    const analytics = getAllStudentsAnalytics(groups);

    // CSV Header
    let csv = 'Student ID,Student Name,Group,Tasks Completed,Time Spent (min),Submission Quality,Contribution Score,Pending Tasks,Overdue Tasks,Last Active\n';

    // CSV Rows
    analytics.forEach(a => {
        const group = groups.find(g => g.id === a.groupId);
        const student = group?.members.find(s => s.id === a.studentId);

        if (student && group) {
            const lastActiveDate = new Date(a.lastActive).toLocaleDateString();
            csv += `${a.studentId},"${student.name}","${group.name}",${a.tasksCompleted},${a.timeSpent},${a.submissionQuality},${a.contributionScore},${a.pendingTasks},${a.overdueTasksCount},"${lastActiveDate}"\n`;
        }
    });

    return csv;
};

/**
 * Download CSV file
 */
export const downloadCSV = (groups: Group[], filename: string = 'student_analytics.csv') => {
    const csv = exportToCSV(groups);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
