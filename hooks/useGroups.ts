import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Group, Student, Project, Badge } from '../types';

export const useGroups = (teacherId?: string) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (teacherId) {
            fetchGroups();
            subscribeToGroupChanges();
        }
    }, [teacherId]);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch groups with all related data
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select(`
          *,
          students (
            *,
            user_profiles (
              email,
              full_name,
              avatar_url
            ),
            mastery_scores (*)
          ),
          projects (
            *,
            project_phases (
              *,
              tasks (*)
            ),
            project_resources (*)
          ),
          group_badges (
            badges (*)
          )
        `)
                .eq('teacher_id', teacherId)
                .order('created_at', { ascending: false });

            if (groupsError) throw groupsError;

            // Transform Supabase data to match our Group type
            const transformedGroups: Group[] = (groupsData || []).map(g => ({
                id: g.id,
                name: g.name,
                projectStatus: g.project_status as 'pending_topic' | 'active',
                progress: g.progress,
                xp: g.xp,
                members: (g.students || []).map((s: any) => ({
                    id: s.id,
                    name: s.user_profiles.full_name || s.user_profiles.email,
                    avatar: s.user_profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.user_profiles.full_name || s.user_profiles.email)}`,
                    scores: s.mastery_scores ? {
                        math: s.mastery_scores.math,
                        science: s.mastery_scores.science,
                        creativity: s.mastery_scores.creativity,
                        leadership: s.mastery_scores.leadership,
                    } : { math: 0, science: 0, creativity: 0, leadership: 0 },
                    averageScore: s.mastery_scores?.average_score || 0,
                    personalXP: s.personal_xp || 0,
                    personalBadges: [],
                    activityLog: [],
                    joinedAt: new Date(s.joined_at).getTime(),
                })),
                project: g.projects ? {
                    topic: g.projects.topic,
                    drivingQuestion: g.projects.driving_question,
                    description: g.projects.description,
                    phases: (g.projects.project_phases || [])
                        .sort((a: any, b: any) => a.phase_order - b.phase_order)
                        .map((p: any) => ({
                            id: p.id,
                            title: p.title,
                            description: p.description,
                            status: p.status as 'locked' | 'active' | 'completed',
                            deadline: p.deadline ? new Date(p.deadline).getTime() : undefined,
                            tasks: (p.tasks || [])
                                .sort((a: any, b: any) => a.task_order - b.task_order)
                                .map((t: any) => ({
                                    id: t.id,
                                    title: t.title,
                                    completed: t.completed,
                                    deadline: t.deadline ? new Date(t.deadline).getTime() : undefined,
                                    isOverdue: t.is_overdue,
                                })),
                        })),
                    resources: (g.projects.project_resources || [])
                        .sort((a: any, b: any) => a.resource_order - b.resource_order)
                        .map((r: any) => ({
                            title: r.title,
                            uri: r.uri,
                        })),
                } : undefined,
                badges: (g.group_badges || []).map((gb: any) => gb.badges),
            }));

            setGroups(transformedGroups);
        } catch (err: any) {
            console.error('Fetch groups error:', err);
            setError(err.message || 'Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    };

    const subscribeToGroupChanges = () => {
        const channel = supabase
            .channel('groups_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'groups', filter: `teacher_id=eq.${teacherId}` },
                () => {
                    fetchGroups(); // Reload data on any change
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    };

    const createGroup = async (name: string, studentIds: string[]) => {
        try {
            setError(null);

            // Create group
            const { data: newGroup, error: groupError } = await supabase
                .from('groups')
                .insert({
                    name,
                    teacher_id: teacherId,
                })
                .select()
                .single();

            if (groupError) throw groupError;

            // Add students to group
            const studentRecords = studentIds.map(userId => ({
                user_id: userId,
                group_id: newGroup.id,
            }));

            const { error: studentsError } = await supabase
                .from('students')
                .insert(studentRecords);

            if (studentsError) throw studentsError;

            await fetchGroups();
            return { success: true, groupId: newGroup.id };
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to create group';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const updateGroupProgress = async (groupId: string, progress: number, xp: number) => {
        try {
            const { error } = await supabase
                .from('groups')
                .update({ progress, xp })
                .eq('id', groupId);

            if (error) throw error;

            // Update local state
            setGroups(prev => prev.map(g =>
                g.id === groupId ? { ...g, progress, xp } : g
            ));

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    return {
        groups,
        loading,
        error,
        refetch: fetchGroups,
        createGroup,
        updateGroupProgress,
    };
};
