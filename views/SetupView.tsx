import React, { useState } from 'react';
import { Student, Group } from '../types';
import { generateMockStudents, generateMockProject } from '../services/mockData.ts';
import { formBalancedGroups } from '../services/groupService.ts';
import { StudentCard } from '../components/StudentCard';

interface Props {
  onGroupsCreated: (groups: Group[], topic: string) => void;
}

export const SetupView: React.FC<Props> = ({ onGroupsCreated }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupSize, setGroupSize] = useState(4);

  const handleImport = () => {
    // Simulate API delay
    setTimeout(() => {
      setStudents(generateMockStudents(20));
      setGroups([]);
    }, 500);
  };

  const handleCreateGroups = () => {
    // Pass group size to service
    const newGroups = formBalancedGroups(students, groupSize);
    setGroups(newGroups.map(g => ({ ...g, projectStatus: 'pending_topic' })));
  };

  const handleSaveGroupsOnly = () => {
    if (groups.length === 0) return;
    onGroupsCreated(groups, '');
  };

  const handleStartProject = async () => {
    if (!topic.trim()) return;
    if (groups.length === 0) return;

    setIsGenerating(true);
    setError(null);
    try {
      const projectTemplate = await generateMockProject(topic);

      // Assign project to all groups (deep copy phases to avoid shared reference state issues)
      const initializedGroups = groups.map(g => ({
        ...g,
        projectStatus: 'active' as const,
        project: {
          ...projectTemplate,
          phases: projectTemplate.phases.map(p => ({
            ...p,
            tasks: p.tasks.map(t => ({ ...t }))
          })),
          resources: projectTemplate.resources
        }
      }));

      onGroupsCreated(initializedGroups, topic);
    } catch (e) {
      console.error(e);
      setError(`Failed to generate project: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">Setup Class</h1>
        <p className="text-slate-500">Import scores, form balanced teams, and launch a PBL campaign.</p>
      </div>

      {/* Step 1: Data Import */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">1. Student Mastery Data</h2>
            <p className="text-sm text-slate-500">Import latest scores from SIS/LMS</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {students.length > 0 && (
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 pl-9"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            )}
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" /><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" /></svg>
              Import Data
            </button>
          </div>
        </div>

        {students.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-1">
            {filteredStudents.length > 0 ? (
              filteredStudents.map(s => <StudentCard key={s.id} student={s} compact />)
            ) : (
              <div className="col-span-full text-center py-8 text-slate-400">No students found matching "{searchTerm}"</div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400">No student data loaded.</p>
          </div>
        )}
      </div>

      {/* Step 2: Group Formation */}
      {students.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">2. Group Formation</h2>
              <p className="text-sm text-slate-500">Algorithmically balanced based on average mastery</p>
            </div>
            <button
              onClick={handleCreateGroups}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium flex items-center gap-2"
            >
              <span>Balance Size:</span>
              <select
                value={groupSize}
                onChange={(e) => setGroupSize(Number(e.target.value))}
                className="bg-emerald-700 border-none text-white text-sm rounded cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </button>

            {groups.length > 0 && (
              <button
                onClick={handleSaveGroupsOnly}
                className="ml-4 px-4 py-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
              >
                Save & Assign Later
              </button>
            )}
          </div>

          {groups.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map(group => (
                <div key={group.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-700 mb-3 flex justify-between">
                    {group.name}
                    <span className="text-xs bg-white px-2 py-1 rounded border shadow-sm text-slate-500">
                      Avg: {(group.members.reduce((acc, m) => acc + m.averageScore, 0) / group.members.length).toFixed(1)}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {group.members.map(m => (
                      <div key={m.id} className="flex items-center gap-2 bg-white p-2 rounded shadow-sm">
                        <img src={m.avatar} className="w-6 h-6 rounded-full" alt="" />
                        <span className="text-sm text-slate-700 truncate">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Project Launch */}
      {groups.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-2xl p-8 shadow-lg text-white">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">3. Launch Project</h2>
            <p className="text-emerald-200 mb-6">
              Enter a topic below. Our AI will generate a Driving Question, Project Description,
              and a 4-Phase Roadmap for every team.
            </p>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Sustainable Urban Farming, Mars Colonization..."
                className="flex-1 px-4 py-3 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                onClick={handleStartProject}
                disabled={isGenerating || !topic}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 disabled:cursor-not-allowed rounded-lg font-bold transition-all shadow-lg flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : 'Launch'}
              </button>
            </div>
            {error && <p className="text-red-300 bg-red-900/50 p-3 rounded">{error}</p>}

          </div>
        </div>
      )}
    </div>
  );
};