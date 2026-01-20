import React, { useState, useMemo } from 'react';
import { Group, StudentAnalytics } from '../types';
import {
    getAllStudentsAnalytics,
    getClassWideMetrics,
    detectStuckStudents,
    downloadCSV
} from '../services/analyticsService';
import { StudentCard } from '../components/StudentCard';

interface Props {
    groups: Group[];
    onBack: () => void;
}

export const AnalyticsView: React.FC<Props> = ({ groups, onBack }) => {
    const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const classMetrics = useMemo(() => getClassWideMetrics(groups), [groups]);
    const allAnalytics = useMemo(() => getAllStudentsAnalytics(groups), [groups]);
    const stuckStudents = useMemo(() => detectStuckStudents(groups), [groups]);

    // Filter analytics based on selected group and search
    const filteredAnalytics = useMemo(() => {
        let filtered = allAnalytics;

        if (selectedGroupId !== 'all') {
            filtered = filtered.filter(a => a.groupId === selectedGroupId);
        }

        if (searchQuery) {
            filtered = filtered.filter(a => {
                const group = groups.find(g => g.id === a.groupId);
                const student = group?.members.find(s => s.id === a.studentId);
                return student?.name.toLowerCase().includes(searchQuery.toLowerCase());
            });
        }

        return filtered;
    }, [allAnalytics, selectedGroupId, searchQuery, groups]);

    const handleExportCSV = () => {
        const exportGroups = selectedGroupId === 'all'
            ? groups
            : groups.filter(g => g.id === selectedGroupId);
        downloadCSV(exportGroups);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">Student Analytics</h1>
                                <p className="text-sm text-slate-500">Track progress and identify areas for support</p>
                            </div>
                        </div>

                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-medium transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export CSV
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Class-Wide Metrics */}
                <section className="mb-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Class Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-500 font-medium">Total Students</span>
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{classMetrics.totalStudents}</div>
                            <div className="text-xs text-slate-400 mt-1">{classMetrics.totalGroups} groups</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-500 font-medium">Avg Progress</span>
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{classMetrics.averageProgress}%</div>
                            <div className="text-xs text-slate-400 mt-1">{classMetrics.totalTasksCompleted} tasks completed</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-500 font-medium">Pending Reviews</span>
                                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{classMetrics.submissionStats.pending}</div>
                            <div className="text-xs text-slate-400 mt-1">{classMetrics.submissionStats.needsRevision} need revision</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-500 font-medium">Stuck Students</span>
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{classMetrics.stuckStudentsCount}</div>
                            <div className="text-xs text-slate-400 mt-1">Inactive for 3+ days</div>
                        </div>
                    </div>
                </section>

                {/* Filters */}
                <section className="mb-6">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        >
                            <option value="all">All Groups</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* Stuck Students Alert */}
                {stuckStudents.length > 0 && (
                    <section className="mb-6">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-red-600 text-xl">⚠️</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-red-900 mb-1">Students Need Attention</h3>
                                    <p className="text-sm text-red-700 mb-3">
                                        {stuckStudents.length} student{stuckStudents.length > 1 ? 's have' : ' has'} been inactive for 3+ days with pending tasks
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {stuckStudents.slice(0, 5).map(analytics => {
                                            const group = groups.find(g => g.id === analytics.groupId);
                                            const student = group?.members.find(s => s.id === analytics.studentId);
                                            return student ? (
                                                <span key={student.id} className="text-xs bg-white px-3 py-1 rounded-full border border-red-200 text-red-800 font-medium">
                                                    {student.name}
                                                </span>
                                            ) : null;
                                        })}
                                        {stuckStudents.length > 5 && (
                                            <span className="text-xs text-red-600 font-medium">+{stuckStudents.length - 5} more</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Student Analytics Cards */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4">
                        Individual Performance ({filteredAnalytics.length} student{filteredAnalytics.length !== 1 ? 's' : ''})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAnalytics.map(analytics => {
                            const group = groups.find(g => g.id === analytics.groupId);
                            const student = group?.members.find(s => s.id === analytics.studentId);

                            if (!student || !group) return null;

                            const isStuck = stuckStudents.some(s => s.studentId === student.id);
                            const lastActiveDate = new Date(analytics.lastActive).toLocaleDateString();

                            return (
                                <div key={student.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isStuck ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'}`}>
                                    {/* Student Header */}
                                    <div className="p-4 border-b border-slate-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full object-cover" />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-800">{student.name}</h3>
                                                <p className="text-xs text-slate-500">{group.name}</p>
                                            </div>
                                            {isStuck && (
                                                <span className="text-red-500 text-xl" title="Needs attention">⚠️</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Analytics Stats */}
                                    <div className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-50 p-3 rounded-lg">
                                                <div className="text-xs text-slate-500 mb-1">Tasks Done</div>
                                                <div className="text-xl font-bold text-slate-800">{analytics.tasksCompleted}</div>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-lg">
                                                <div className="text-xs text-slate-500 mb-1">Time Spent</div>
                                                <div className="text-xl font-bold text-slate-800">{analytics.timeSpent}m</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-50 p-3 rounded-lg">
                                                <div className="text-xs text-slate-500 mb-1">Quality</div>
                                                <div className="text-xl font-bold text-emerald-600">{analytics.submissionQuality}%</div>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-lg">
                                                <div className="text-xs text-slate-500 mb-1">Contribution</div>
                                                <div className="text-xl font-bold text-blue-600">{analytics.contributionScore}%</div>
                                            </div>
                                        </div>

                                        {analytics.pendingTasks > 0 && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                                                <span className="text-xs font-medium text-yellow-800">
                                                    {analytics.pendingTasks} pending task{analytics.pendingTasks > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        )}

                                        {analytics.overdueTasksCount > 0 && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                                                <span className="text-xs font-medium text-red-800">
                                                    {analytics.overdueTasksCount} overdue task{analytics.overdueTasksCount > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        )}

                                        <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-100">
                                            Last active: {lastActiveDate}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredAnalytics.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                            <div className="text-slate-400 mb-2">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-slate-500 font-medium">No students found</p>
                            <p className="text-sm text-slate-400">Try adjusting your filters</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};
