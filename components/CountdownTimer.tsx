import React, { useState, useEffect } from 'react';
import { calculateTimeRemaining, getUrgencyColor, getUrgencyLevel } from '../services/deadlineService';

interface Props {
    deadline?: number;
    compact?: boolean;
    showIcon?: boolean;
}

export const CountdownTimer: React.FC<Props> = ({ deadline, compact = false, showIcon = true }) => {
    const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(deadline));
    const [urgency, setUrgency] = useState(getUrgencyLevel(deadline));

    useEffect(() => {
        if (!deadline) return;

        // Update every minute
        const interval = setInterval(() => {
            setTimeRemaining(calculateTimeRemaining(deadline));
            setUrgency(getUrgencyLevel(deadline));
        }, 60000);

        // Initial update
        setTimeRemaining(calculateTimeRemaining(deadline));
        setUrgency(getUrgencyLevel(deadline));

        return () => clearInterval(interval);
    }, [deadline]);

    if (!deadline) {
        return null;
    }

    const colorClass = getUrgencyColor(deadline);

    if (compact) {
        return (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${colorClass}`}>
                {showIcon && (
                    <span className="mr-1">
                        {urgency === 'overdue' && '⚠️'}
                        {urgency === 'high' && '🔴'}
                        {urgency === 'medium' && '🟡'}
                        {urgency === 'low' && '🟢'}
                    </span>
                )}
                {timeRemaining}
            </span>
        );
    }

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClass}`}>
            {showIcon && (
                <div className="text-lg">
                    {urgency === 'overdue' && '⚠️'}
                    {urgency === 'high' && '⏰'}
                    {urgency === 'medium' && '⏱️'}
                    {urgency === 'low' && '✅'}
                </div>
            )}
            <div>
                <div className="text-xs font-semibold uppercase tracking-wide opacity-75">
                    {urgency === 'overdue' ? 'Overdue' : 'Due in'}
                </div>
                <div className="font-bold">{timeRemaining}</div>
            </div>
        </div>
    );
};
