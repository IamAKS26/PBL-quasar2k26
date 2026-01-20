import React from 'react';
import { Student } from '../types';

interface Props {
  student: Student;
  compact?: boolean;
}

const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex items-center text-xs mt-1">
    <span className="w-16 text-slate-500">{label}</span>
    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${value}%` }}></div>
    </div>
    <span className="ml-2 text-slate-400 w-6 text-right">{value}</span>
  </div>
);

export const StudentCard: React.FC<Props> = ({ student, compact }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover" />
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">{student.name}</h3>
          <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">
            Avg: {student.averageScore}
          </span>
        </div>
      </div>

      {!compact && (
        <div className="space-y-1">
          <StatBar label="Math" value={student.scores.math} color="bg-blue-500" />
          <StatBar label="Science" value={student.scores.science} color="bg-teal-500" />
          <StatBar label="Creative" value={student.scores.creativity} color="bg-purple-500" />
          <StatBar label="Lead" value={student.scores.leadership} color="bg-amber-500" />
        </div>
      )}
    </div>
  );
};
