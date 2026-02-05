
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    description?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, description }: StatsCardProps) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                <div className="p-2 bg-slate-50 rounded-lg">
                    <Icon className="w-5 h-5 text-slate-900" />
                </div>
            </div>
            <div className="space-y-1">
                <h2 className="text-3xl font-bold text-slate-900">{value}</h2>
                {(trend || description) && (
                    <p className="text-xs text-slate-400">
                        {trend && <span className="text-green-600 font-medium">{trend} </span>}
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
