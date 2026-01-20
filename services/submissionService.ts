import { Submission, SubmissionStatus, SubmissionType } from '../types';

export const submitEvidence = async (
    taskId: string,
    type: SubmissionType,
    url: string
): Promise<Submission> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
        id: `sub-${Date.now()}`,
        type,
        url,
        status: 'pending',
        submittedAt: Date.now()
    };
};

export const updateSubmissionStatus = async (
    submissionId: string,
    status: SubmissionStatus,
    feedback?: string
): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
};
