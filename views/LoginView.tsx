import React from 'react';
import { Group, UserRole } from '../types';

interface Props {
    groups: Group[];
    onLogin: (role: UserRole, groupId?: string) => void;
}

export const LoginView: React.FC<Props> = ({ groups, onLogin }) => {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-emerald-100 rounded-xl mb-4 text-emerald-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                            <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">PBL by GyanSetu</h1>
                    <p className="text-slate-500 mt-2">Sign in to GyanSetu Platform</p>
                </div>

                <div className="space-y-6">
                    {/* Teacher Login */}
                    <button
                        onClick={() => onLogin(UserRole.TEACHER)}
                        className="w-full group relative flex items-center p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                    >
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mr-4 group-hover:bg-emerald-200">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                        </div>
                        <div className="text-left">
                            <span className="block font-bold text-slate-800 group-hover:text-emerald-700">Teacher Login</span>
                            <span className="text-xs text-slate-500">Manage Classes & Content</span>
                        </div>
                        <svg className="w-5 h-5 text-slate-300 ml-auto group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-slate-400">Student Portal</span>
                        </div>
                    </div>

                    {/* Student Login - Only show if groups exist */}
                    {groups.length > 0 ? (
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-slate-600 mb-2">Select Your Team:</p>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                                {groups.map(group => (
                                    <button
                                        key={group.id}
                                        onClick={() => onLogin(UserRole.STUDENT, group.id)}
                                        className="flex items-center p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold mr-3 text-sm">
                                            {group.name.charAt(group.name.length - 1)}
                                        </div>
                                        <div>
                                            <span className="block font-medium text-slate-700">{group.name}</span>
                                            <div className="flex -space-x-1 mt-1">
                                                {group.members.slice(0, 3).map(m => (
                                                    <img key={m.id} src={m.avatar} className="w-4 h-4 rounded-full border border-white" alt="" />
                                                ))}
                                                {group.members.length > 3 && (
                                                    <div className="w-4 h-4 rounded-full bg-slate-200 border border-white text-[8px] flex items-center justify-center text-slate-600">
                                                        +{group.members.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <svg className="w-4 h-4 text-slate-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            <p className="text-sm text-slate-500">No active classes found.</p>
                            <p className="text-xs text-slate-400 mt-1">Teacher must set up groups first.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
