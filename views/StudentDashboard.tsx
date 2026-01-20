import React, { useState } from 'react';
import { Group, SubmissionType } from '../types';
import { ProgressBar } from '../components/ProgressBar';
import { submitEvidence } from '../services/submissionService';

interface Props {
    group: Group;
    onLogout: () => void;
}

export const StudentDashboard: React.FC<Props> = ({ group: initialGroup, onLogout }) => {
    const [group, setGroup] = useState<Group>(initialGroup);
    const [activePhaseIndex, setActivePhaseIndex] = useState(0);
    const [submissionModal, setSubmissionModal] = useState<{ taskId: string, title: string } | null>(null);
    const [submissionUrl, setSubmissionUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If no project is assigned yet
    if (group.projectStatus === 'pending_topic' || !group.project) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                        {group.name.charAt(group.name.length - 1)}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome, {group.name}!</h2>
                    <p className="text-slate-500 mb-6">Your teacher has formed your team. Please wait for a project topic to be assigned.</p>
                    <button onClick={onLogout} className="text-slate-400 hover:text-slate-600 underline">Logout</button>
                </div>
            </div>
        );
    }

    const activePhase = group.project.phases[activePhaseIndex];

    const handleSubmit = async () => {
        if (!submissionModal || !submissionUrl) return;

        setIsSubmitting(true);
        try {
            // Mock submission - in real app would update DB
            await submitEvidence(submissionModal.taskId, 'github', submissionUrl);

            // Locally update UI to show pending
            const newPhases = group.project!.phases.map(p => ({
                ...p,
                tasks: p.tasks.map(t => {
                    if (t.id !== submissionModal.taskId) return t;
                    return {
                        ...t,
                        submission: {
                            id: 'temp',
                            type: 'github',
                            url: submissionUrl,
                            status: 'pending',
                            submittedAt: Date.now()
                        }
                    };
                })
            }));

            setGroup({ ...group, project: { ...group.project!, phases: newPhases } });
            setSubmissionModal(null);
            setSubmissionUrl('');
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl">
                            {group.name.charAt(group.name.length - 1)}
                        </div>
                        <div>
                            <h1 className="font-bold">{group.name}</h1>
                            <div className="flex -space-x-1 mt-1">
                                {group.members.map(m => (
                                    <img key={m.id} src={m.avatar} className="w-5 h-5 rounded-full border border-slate-900" title={m.name} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {group.project.phases.map((phase, idx) => (
                        <button
                            key={phase.id}
                            onClick={() => phase.status !== 'locked' && setActivePhaseIndex(idx)}
                            className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-colors ${idx === activePhaseIndex ? 'bg-emerald-600 text-white' :
                                phase.status === 'locked' ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <div className="flex justify-between">
                                <span>Phase {idx + 1}</span>
                                {phase.status === 'completed' && <span>✓</span>}
                            </div>
                            <div className="truncate opacity-80 text-xs mt-1">{phase.title}</div>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-700">
                    <button onClick={onLogout} className="w-full py-2 px-4 rounded border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 transition-colors text-sm">
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
                    <h1 className="text-2xl font-bold text-slate-800">{activePhase.title}</h1>
                    <p className="text-slate-500 mt-1">{activePhase.description}</p>
                </header>

                <div className="p-8 max-w-4xl mx-auto space-y-6">
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-6">
                        <h3 className="font-bold text-emerald-900 mb-2">Driving Question</h3>
                        <p className="text-emerald-700 italic">"{group.project.drivingQuestion}"</p>
                    </div>

                    <div className="space-y-4">
                        {activePhase.tasks.map(task => (
                            <div key={task.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={`font-bold ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{task.title}</h3>
                                        {task.completed && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">Complete</span>}
                                        {task.submission?.status === 'pending' && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">Under Review</span>}
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {task.completed ? 'Evidence approved.' :
                                            task.submission ? 'Submission awaiting teacher review.' :
                                                'Submit evidence to complete this task.'}
                                    </p>
                                    {task.submission && (
                                        <div className="mt-2 text-xs bg-slate-50 inline-block px-2 py-1 rounded border border-slate-200 text-slate-500 truncate max-w-xs">
                                            🔗 {task.submission.url}
                                        </div>
                                    )}
                                </div>

                                {!task.completed && !task.submission && (
                                    <button
                                        onClick={() => setSubmissionModal({ taskId: task.id, title: task.title })}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm font-medium whitespace-nowrap"
                                    >
                                        Submit Evidence
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Submission Modal */}
            {submissionModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Submit Evidence</h3>
                        <p className="text-sm text-slate-500 mb-4">Task: {submissionModal.title}</p>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GitHub Repo / Document URL</label>
                            <input
                                type="url"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                placeholder="https://github.com/..."
                                value={submissionUrl}
                                onChange={(e) => setSubmissionUrl(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setSubmissionModal(null)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!submissionUrl || isSubmitting}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Work'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
