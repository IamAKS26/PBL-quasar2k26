import React, { useState } from 'react';
import { SetupView } from './views/SetupView';
import { TeacherDashboard } from './views/TeacherDashboard';
import { StudentDashboard } from './views/StudentDashboard';
import { LoginView } from './views/LoginView';
import { Group, AppView, UserRole } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [groups, setGroups] = useState<Group[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  const handleLogin = (role: UserRole, groupId?: string) => {
    setUserRole(role);
    if (role === UserRole.TEACHER) {
      // If groups exist, go to dashboard, else setup
      setCurrentView(groups.length > 0 ? AppView.TEACHER_DASHBOARD : AppView.SETUP);
    } else {
      if (groupId) {
        setCurrentGroupId(groupId);
        setCurrentView(AppView.STUDENT_DASHBOARD);
      }
    }
  };

  const handleGroupsCreated = (createdGroups: Group[], topic: string) => {
    setGroups(createdGroups);
    // If topic is set (project launched), go to dashboard
    // If no topic (saved for later), go to dashboard but it will show "Assign Project" state
    setCurrentView(AppView.TEACHER_DASHBOARD);
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentGroupId(null);
    setCurrentView(AppView.LOGIN);
  };

  const activeGroup = groups.find(g => g.id === currentGroupId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {currentView === AppView.LOGIN && (
        <LoginView groups={groups} onLogin={handleLogin} />
      )}

      {currentView === AppView.SETUP && (
        <SetupView onGroupsCreated={handleGroupsCreated} />
      )}

      {currentView === AppView.TEACHER_DASHBOARD && (
        <TeacherDashboard groups={groups} onBack={handleLogout} />
      )}

      {currentView === AppView.STUDENT_DASHBOARD && activeGroup && (
        <StudentDashboard group={activeGroup} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
