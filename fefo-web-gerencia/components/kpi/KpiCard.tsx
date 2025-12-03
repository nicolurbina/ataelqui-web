// components/kpi/KpiCard.tsx
import React from 'react';

interface KpiCardProps {
    title: string;
    value: string;
    description: string;
    type?: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
    trend?: string; // e.g., "-2% vs mes anterior"
    icon?: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, description, type = 'success', trend, icon }) => {
    let valueColorClass = 'text-gray-900';
    let iconColorClass = 'text-gray-400';

    // Text colors based on type
    switch (type) {
        case 'danger':
            valueColorClass = 'text-red-600';
            iconColorClass = 'text-red-500';
            break;
        case 'warning':
            valueColorClass = 'text-amber-500'; // Gold/Orange
            iconColorClass = 'text-amber-500';
            break;
        case 'success':
            valueColorClass = 'text-emerald-600';
            iconColorClass = 'text-emerald-500';
            break;
        case 'info':
            valueColorClass = 'text-blue-600';
            iconColorClass = 'text-blue-500';
            break;
        default:
            valueColorClass = 'text-gray-900';
            iconColorClass = 'text-gray-400';
    }

    return (
        <div className="p-6 rounded-2xl bg-white border border-gray-100 card-shadow transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    {icon && <div className={`${iconColorClass}`}>{icon}</div>}
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{title}</h3>
                </div>
                {/* Optional: Status Indicator Dot */}
                <div className={`h-2 w-2 rounded-full ${type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : type === 'success' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
            </div>

            <div className="flex flex-col">
                <p className={`text-3xl font-bold ${valueColorClass} tracking-tight`}>{value}</p>
                <div className="flex items-center mt-2 gap-2">
                    {trend && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend.includes('-') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {trend}
                        </span>
                    )}
                    <p className="text-xs text-gray-400 font-medium">{description}</p>
                </div>
            </div>
        </div>
    );
};

export default KpiCard;