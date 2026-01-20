import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { UserRole } from '../types';

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    fullName?: string;
    avatarUrl?: string;
}

export const useAuth = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check active session
        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                await loadUserProfile(session.user);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const checkSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await loadUserProfile(session.user);
            }
        } catch (err) {
            console.error('Session error:', err);
            setError('Failed to load session');
        } finally {
            setLoading(false);
        }
    };

    const loadUserProfile = async (authUser: User) => {
        try {
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profileError) throw profileError;

            setUser({
                id: authUser.id,
                email: authUser.email!,
                role: profile.role as UserRole,
                fullName: profile.full_name,
                avatarUrl: profile.avatar_url,
            });
        } catch (err) {
            console.error('Profile error:', err);
            setError('Failed to load user profile');
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            if (data.user) {
                await loadUserProfile(data.user);
            }

            return { success: true };
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to sign in';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string, fullName: string, role: UserRole = UserRole.STUDENT) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) throw signUpError;

            if (data.user) {
                // Update the profile with full name and role
                const { error: updateError } = await supabase
                    .from('user_profiles')
                    .update({
                        full_name: fullName,
                        role: role,
                    })
                    .eq('id', data.user.id);

                if (updateError) throw updateError;

                await loadUserProfile(data.user);
            }

            return { success: true };
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to sign up';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUser(null);
        } catch (err: any) {
            setError(err.message || 'Failed to sign out');
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
    };
};
