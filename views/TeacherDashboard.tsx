import React, { useState, useEffect } from 'react';
import { Group, ProjectPhase, Task, Badge } from '../types';
import { StudentCard } from '../components/StudentCard';
import { ProgressBar } from '../components/ProgressBar';
import { calculateXP, checkNewBadges, BADGES } from '../services/gamificationService';

interface Props {
    groups: Group[];
    onBack: () => void;
}

export const TeacherDashboard: React.FC<Props> = ({ groups: initialGroups, onBack }) => {
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [activeGroupId, setActiveGroupId] = useState<string>(initialGroups[0]?.id);
    const [activePhaseIndex, setActivePhaseIndex] = useState(0);
    const [notification, setNotification] = useState<Badge | null>(null);
    const [viewMode, setViewMode] = useState<'phases' | 'analytics' | 'submissions'>('phases');

    const activeGroup = groups.find(g => g.id === activeGroupId);

    useEffect(() => {
        if (activeGroup?.project) {
            // Find first active phase if not set by user interaction
            const idx = activeGroup.project.phases.findIndex(p => p.status === 'active');
            if (idx !== -1 && activeGroup.project.phases[activePhaseIndex].status === 'locked') {
                setActivePhaseIndex(idx);
            }
        }
    }, [activeGroupId]); // Only run on group switch

    // Clear notification after 3s
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    if (!activeGroup) return <div>Loading...</div>;

    if (activeGroup.projectStatus === 'pending_topic' || !activeGroup.project) {
        return (
            <div className="h-screen bg-slate-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center max-w-sm">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Assign Project</h2>
                    <p className="text-slate-500 mb-6">This group needs a topic to start their journey.</p>
                    <button onClick={onBack} className="text-emerald-600 font-bold hover:underline">Return to Setup</button>
                </div>
            </div>
        );
    }

    const project = activeGroup.project;
    const activePhase = project.phases[activePhaseIndex];

    const toggleTask = (groupId: string, phaseId: string, taskId: string) => {
        const updatedGroups = groups.map(g => {
            if (g.id !== groupId) return g;
            if (!g.project) return g;

            const newPhases: ProjectPhase[] = g.project.phases.map(p => {
                if (p.id !== phaseId) return p;

                const newTasks = p.tasks.map(t => {
                    if (t.id !== taskId) return t;

                    // If there's a submission, toggle approves/rejects it
                    if (t.submission) {
                        const newStatus = t.completed ? 'pending' : 'approved'; // toggle back
                        return {
                            ...t,
                            completed: !t.completed,
                            submission: {
                                ...t.submission,
                                status: newStatus as any
                            }
                        };
                    }

                    return { ...t, completed: !t.completed };
                });

                const allComplete = newTasks.every(t => t.completed);
                const newStatus: ProjectPhase['status'] = allComplete ? 'completed' : 'active';

                return { ...p, tasks: newTasks, status: newStatus };
            });

            // Unlock logic
            const currentPhaseIdx = newPhases.findIndex(p => p.id === phaseId);
            if (currentPhaseIdx !== -1 && newPhases[currentPhaseIdx].status === 'completed' && currentPhaseIdx < newPhases.length - 1) {
                const nextPhase = newPhases[currentPhaseIdx + 1];
                if (nextPhase.status === 'locked') {
                    // Create a copy to avoid mutation of shared reference if it wasn't modified in the map above
                    newPhases[currentPhaseIdx + 1] = { ...nextPhase, status: 'active' };
                }
            }

            const totalTasks = newPhases.reduce((acc, p) => acc + p.tasks.length, 0);
            const completedTasks = newPhases.reduce((acc, p) => acc + p.tasks.filter(t => t.completed).length, 0);
            const progress = Math.round((completedTasks / totalTasks) * 100);

            // Update Project in temp group to calc XP
            const tempGroup: Group = { ...g, project: { ...g.project, phases: newPhases }, progress };

            // Recalculate Gamification Stats
            const newXP = calculateXP(tempGroup);
            const newBadges = checkNewBadges(tempGroup, g.badges);

            // Check for newly earned badge for notification
            if (newBadges.length > g.badges.length) {
                const latest = newBadges[newBadges.length - 1];
                setNotification(latest);
            }

            return { ...tempGroup, xp: newXP, badges: newBadges };
        });

        setGroups(updatedGroups);
    };

    // Sort groups for leaderboard
    const sortedGroups = [...groups].sort((a, b) => b.xp - a.xp);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden relative">

            {/* Badge Notification Toast */}
            {notification && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
                    <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700">
                        <span className="text-2xl">{notification.icon}</span>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Badge Unlocked!</p>
                            <p className="font-bold">{notification.name}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Left Sidebar: Phases */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-lg flex-shrink-0">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={onBack}>
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5z" /></svg>
                        </div>
                        <h1 className="font-bold text-slate-800 text-lg">PBL by GyanSetu</h1>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Active Team</span>
                        <select
                            className="w-full bg-transparent font-bold text-slate-800 outline-none mt-1 cursor-pointer"
                            value={activeGroupId}
                            onChange={(e) => setActiveGroupId(e.target.value)}
                        >
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name} (Lvl {Math.floor(g.xp / 1000) + 1})</option>)}
                        </select>

                        <ProgressBar
                            value={activeGroup.progress}
                            label="Progress"
                            showPercentage
                            className="mt-3"
                        />
                    </div>

                    {/* View Mode Tabs */}
                    <div className="mt-4 grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('phases')}
                            className={`px-3 py-2 rounded text-xs font-semibold transition-all ${viewMode === 'phases'
                                ? 'bg-white text-emerald-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            Phases
                        </button>
                        <button
                            onClick={() => setViewMode('submissions')}
                            className={`px-3 py-2 rounded text-xs font-semibold transition-all ${viewMode === 'submissions'
                                ? 'bg-white text-emerald-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            Reviews
                        </button>
                        <button
                            onClick={() => setViewMode('analytics')}
                            className={`px-3 py-2 rounded text-xs font-semibold transition-all ${viewMode === 'analytics'
                                ? 'bg-white text-emerald-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            Analytics
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {viewMode === 'phases' && project.phases.map((phase, idx) => (
                        <div
                            key={phase.id}
                            onClick={() => phase.status !== 'locked' && setActivePhaseIndex(idx)}
                            className={`p-4 rounded-xl transition-all cursor-pointer border relative overflow-hidden ${idx === activePhaseIndex
                                ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                : phase.status === 'locked'
                                    ? 'bg-slate-50 border-transparent opacity-60 cursor-not-allowed'
                                    : 'bg-white border-slate-100 hover:border-emerald-100'
                                }`}
                        >
                            {/* Progress bar overlay for phases */}
                            {phase.status !== 'locked' && (
                                <div className="absolute bottom-0 left-0 h-1 bg-emerald-100 w-full">
                                    <div
                                        className="h-full bg-emerald-500 transition-all"
                                        style={{ width: `${(phase.tasks.filter(t => t.completed).length / phase.tasks.length) * 100}%` }}
                                    ></div>
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <span className={`text-xs font-bold uppercase tracking-wider py-1 px-2 rounded ${phase.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                    phase.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-slate-200 text-slate-500'
                                    }`}>
                                    Phase {idx + 1}
                                </span>
                                {phase.status === 'completed' && (
                                    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                )}
                            </div>
                            <h3 className={`font-semibold relative z-10 ${idx === activePhaseIndex ? 'text-emerald-900' : 'text-slate-700'}`}>{phase.title}</h3>
                        </div>
                    ))}

                    {/* Submissions View Sidebar */}
                    {viewMode === 'submissions' && (
                        <div className="space-y-3">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-yellow-800 uppercase">Pending Review</span>
                                    <span className="text-lg font-bold text-yellow-700">
                                        {groups.flatMap(g => g.project?.phases.flatMap(p => p.tasks.filter(t => t.submission?.status === 'pending')) || []).length}
                                    </span>
                                </div>
                                <p className="text-xs text-yellow-700">Submissions awaiting your review</p>
                            </div>

                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-orange-800 uppercase">Needs Revision</span>
                                    <span className="text-lg font-bold text-orange-700">
                                        {groups.flatMap(g => g.project?.phases.flatMap(p => p.tasks.filter(t => t.submission?.status === 'needs_revision')) || []).length}
                                    </span>
                                </div>
                                <p className="text-xs text-orange-700">Returned for improvements</p>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-emerald-800 uppercase">Approved</span>
                                    <span className="text-lg font-bold text-emerald-700">
                                        {groups.flatMap(g => g.project?.phases.flatMap(p => p.tasks.filter(t => t.submission?.status === 'approved')) || []).length}
                                    </span>
                                </div>
                                <p className="text-xs text-emerald-700">Successfully completed</p>
                            </div>
                        </div>
                    )}

                    {/* Analytics View Sidebar */}
                    {viewMode === 'analytics' && (
                        <div className="space-y-3">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-blue-700 mb-1">
                                    {groups.flatMap(g => g.members).length}
                                </div>
                                <p className="text-xs text-blue-700 font-medium">Total Students</p>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-emerald-700 mb-1">
                                    {Math.round(groups.reduce((sum, g) => sum + g.progress, 0) / groups.length)}%
                                </div>
                                <p className="text-xs text-emerald-700 font-medium">Avg Progress</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                <p className="text-xs text-slate-600 mb-2">Click a view to see detailed analytics and export reports.</p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content: Tasks */}
            <main className="flex-1 overflow-y-auto bg-slate-50/50 flex flex-col min-w-0">
                {viewMode === 'phases' && (
                    <>
                        <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-20">
                            <div>
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-slate-800">{activePhase.title}</h2>
                                    <div className="hidden md:block">
                                        <span className="text-xs text-slate-400 uppercase font-bold">Phase Completion</span>
                                        <div className="w-48 mt-1">
                                            <ProgressBar
                                                value={(activePhase.tasks.filter(t => t.completed).length / activePhase.tasks.length) * 100}
                                                height="h-2"
                                                color="bg-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-500 mt-1">{activePhase.description}</p>
                                {project.resources && project.resources.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.74 5.27z" /></svg>
                                            Google Search Resources
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {project.resources.map((res, i) => (
                                                <a key={i} href={res.uri} target="_blank" rel="noopener noreferrer"
                                                    className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors flex items-center gap-1 truncate max-w-[200px]">
                                                    <span className="truncate">{res.title}</span>
                                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </header>

                        <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
                            <section>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                                        Tasks
                                    </h3>
                                    <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                        {activePhase.tasks.filter(t => t.completed).length} / {activePhase.tasks.length} Complete
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {activePhase.tasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => toggleTask(activeGroup.id, activePhase.id, task.id)}
                                            className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer group ${task.completed
                                                ? 'bg-emerald-50 border-emerald-100'
                                                : task.submission?.status === 'pending'
                                                    ? 'bg-yellow-50 border-yellow-200'
                                                    : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md'
                                                }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors flex-shrink-0 ${task.completed
                                                ? 'bg-emerald-500 border-emerald-500'
                                                : task.submission?.status === 'pending'
                                                    ? 'bg-yellow-400 border-yellow-400'
                                                    : 'border-slate-300 group-hover:border-emerald-400'
                                                }`}>
                                                {task.completed && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                                {task.submission?.status === 'pending' && <span className="text-[10px] font-bold text-white">!</span>}
                                            </div>
                                            <div className="flex-1">
                                                <span className={`block ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                                                    {task.title}
                                                </span>
                                                {task.submission && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-emerald-500 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 font-mono">
                                                            {task.submission.type}: {task.submission.url}
                                                        </span>
                                                        {task.submission.status === 'pending' && <span className="text-[10px] uppercase font-bold text-yellow-600">Review Required</span>}
                                                    </div>
                                                )}
                                            </div>
                                            {task.completed && <span className="text-xs font-bold text-emerald-600 ml-2">+50 XP</span>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </>
                )}

                {/* Submissions Review View */}
                {viewMode === 'submissions' && (
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Submission Reviews</h2>
                        <div className="max-w-4xl mx-auto space-y-4">
                            {groups.flatMap(g =>
                                g.project?.phases.flatMap(p =>
                                    p.tasks.filter(t => t.submission).map(task => ({
                                        group: g,
                                        phase: p,
                                        task
                                    }))
                                ) || []
                            ).map(({ group, phase, task }, idx) => (
                                <div key={`${group.id}-${task.id}`} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-slate-800">{task.title}</h3>
                                            <p className="text-sm text-slate-500">{group.name} • {phase.title}</p>
                                        </div>
                                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${task.submission?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            task.submission?.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                task.submission?.status === 'needs_revision' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {task.submission?.status === 'needs_revision' ? 'Needs Revision' : task.submission?.status}
                                        </span>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-lg mb-3">
                                        <a href={task.submission?.url} target="_blank" rel="noopener noreferrer"
                                            className="text-sm text-emerald-600 hover:underline flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            {task.submission?.url}
                                        </a>
                                    </div>

                                    {task.submission?.feedback && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                            <p className="text-xs font-bold text-blue-800 mb-1">Teacher Feedback:</p>
                                            <p className="text-sm text-blue-900">{task.submission.feedback.teacherComment}</p>
                                        </div>
                                    )}

                                    {task.submission?.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleTask(group.id, phase.id, task.id)}
                                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-medium"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-400 font-medium"
                                            >
                                                Request Revision
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Analytics View */}
                {viewMode === 'analytics' && (
                    <div className="p-8">
                        <div className="max-w-6xl mx-auto">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Student Analytics</h2>
                            <p className="text-slate-500 mb-6">For detailed analytics and export options, this view provides comprehensive insights.</p>

                            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-8 text-center">
                                <div className="text-6xl mb-4">📊</div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Full Analytics Dashboard</h3>
                                <p className="text-slate-600 mb-4">View comprehensive student performance metrics, export reports, and identify students who need support.</p>
                                <p className="text-sm text-slate-500 italic">Note: Full analytics view with charts and export functionality will be integrated in the next update.</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Right Sidebar: Gamification */}
            <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full z-10 shadow-lg overflow-y-auto">

                {/* Team Stats Card */}
                <div className="p-6 bg-slate-900 text-white">
                    <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Team Performance</h3>

                    <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl font-bold text-white">{activeGroup.xp.toLocaleString()}</span>
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">XP</span>
                    </div>

                    <ProgressBar
                        value={(activeGroup.xp % 1000) / 10}
                        height="h-1.5"
                        trackColor="bg-slate-700"
                        color="bg-emerald-400"
                        className="mb-6"
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-800 p-3 rounded-lg text-center">
                            <span className="block text-2xl font-bold">{activeGroup.progress}%</span>
                            <span className="text-xs text-slate-400">Completion</span>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-lg text-center">
                            <span className="block text-2xl font-bold">{activeGroup.badges.length}</span>
                            <span className="text-xs text-slate-400">Badges</span>
                        </div>
                    </div>
                </div>

                {/* Badges Section */}
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        Badges Earned
                    </h3>
                    {activeGroup.badges.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                            {activeGroup.badges.map(badge => (
                                <div key={badge.id} className="group relative flex justify-center">
                                    <div className={`w-12 h-12 ${badge.color} rounded-full flex items-center justify-center text-xl shadow-sm cursor-help transition-transform hover:scale-110`}>
                                        {badge.icon}
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block w-32 bg-slate-800 text-white text-xs p-2 rounded z-20 text-center pointer-events-none">
                                        <p className="font-bold">{badge.name}</p>
                                        <p className="opacity-80">{badge.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 italic">No badges yet. Start completing tasks!</p>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400 font-semibold mb-2 uppercase">Next Badge</p>
                        <div className="flex items-center gap-3 opacity-50 grayscale">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-lg">?</div>
                            <div className="text-xs text-slate-500">Keep working to unlock more!</div>
                        </div>
                    </div>
                </div>

                {/* Leaderboard Section */}
                <div className="flex-1 p-6 bg-slate-50">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        Leaderboard
                    </h3>
                    <div className="space-y-3">
                        {sortedGroups.map((g, idx) => (
                            <div
                                key={g.id}
                                className={`flex items-center p-3 rounded-lg border ${g.id === activeGroupId
                                    ? 'bg-white border-indigo-200 shadow-md ring-1 ring-emerald-50'
                                    : 'bg-white border-slate-200 opacity-80'
                                    }`}
                            >
                                <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-lg mr-3 ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    idx === 1 ? 'bg-slate-200 text-slate-700' :
                                        idx === 2 ? 'bg-orange-100 text-orange-800' :
                                            'bg-slate-50 text-slate-500'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-slate-800 truncate text-sm">{g.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <ProgressBar
                                            value={g.progress}
                                            height="h-1"
                                            trackColor="bg-slate-100"
                                            color="bg-indigo-500"
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div className="text-right ml-2">
                                    <span className="block font-bold text-indigo-600 text-sm">{g.xp}</span>
                                    <span className="text-[10px] text-slate-400 uppercase">XP</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

        </div>
    );
};
