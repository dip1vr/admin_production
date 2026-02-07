import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Loader2, Globe, Search, TrendingUp, Users, Monitor, Smartphone, Layout } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

interface SiteVisit {
    id: string;
    ip: string;
    path: string;
    platform: string;
    referrer: string;
    screenResolution: string;
    timestamp: any;
    userAgent: string;
    visitorId: string;
}

const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'];

export default function SiteVisits() {
    const [visits, setVisits] = useState<SiteVisit[]>([]);
    const [filteredVisits, setFilteredVisits] = useState<SiteVisit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Analytics State
    const [dailyStats, setDailyStats] = useState<any[]>([]);
    const [platformStats, setPlatformStats] = useState<any[]>([]);
    const [pageStats, setPageStats] = useState<any[]>([]);
    const [uniqueVisitors, setUniqueVisitors] = useState(0);
    const [todaysVisits, setTodaysVisits] = useState(0);

    const fetchVisits = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "site_visits"));
            const fetchedVisits: SiteVisit[] = [];
            querySnapshot.forEach((doc) => {
                fetchedVisits.push({ id: doc.id, ...doc.data() } as SiteVisit);
            });

            // Sort by timestamp desc for table
            fetchedVisits.sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeB - timeA;
            });

            processAnalytics(fetchedVisits);
            setVisits(fetchedVisits);
            setFilteredVisits(fetchedVisits);
        } catch (error) {
            console.error("Error fetching site visits:", error);
        } finally {
            setLoading(false);
        }
    };

    const processAnalytics = (data: SiteVisit[]) => {
        // 1. Unique Visitors
        const uniqueIds = new Set(data.map(v => v.visitorId));
        setUniqueVisitors(uniqueIds.size);

        // 2. Today's Visits
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
        const todayCount = data.filter(v => (v.timestamp?.seconds || 0) >= startOfDay).length;
        setTodaysVisits(todayCount);

        // 3. Daily Stats (Last 7 Days)
        const dailyMap = new Map<string, number>();
        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); // e.g. "06 Feb"
            dailyMap.set(key, 0);
        }

        data.forEach(v => {
            if (v.timestamp) {
                const date = new Date(v.timestamp.seconds * 1000);
                const key = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                if (dailyMap.has(key)) {
                    dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
                }
            }
        });

        const dailyData = Array.from(dailyMap.entries()).map(([date, visits]) => ({ date, visits }));
        setDailyStats(dailyData);

        // 4. Platform Stats (Simple grouping)
        const platMap = new Map<string, number>();
        data.forEach(v => {
            // Simplify platform names
            let plat = v.platform || 'Unknown';
            if (plat.includes('Win')) plat = 'Windows';
            else if (plat.includes('Mac')) plat = 'MacOS';
            else if (plat.includes('Linux')) plat = 'Linux';
            else if (plat.includes('iPhone') || plat.includes('iPad')) plat = 'iOS';
            else if (plat.includes('Android')) plat = 'Android';

            platMap.set(plat, (platMap.get(plat) || 0) + 1);
        });
        const platData = Array.from(platMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5
        setPlatformStats(platData);

        // 5. Top Pages
        const pageMap = new Map<string, number>();
        data.forEach(v => {
            const path = v.path || '/';
            pageMap.set(path, (pageMap.get(path) || 0) + 1);
        });
        const pageData = Array.from(pageMap.entries())
            .map(([name, visits]) => ({ name, visits }))
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 5); // Top 5
        setPageStats(pageData);
    };

    useEffect(() => {
        fetchVisits();
    }, []);

    useEffect(() => {
        let result = visits;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(visit =>
                visit.visitorId?.toLowerCase().includes(query) ||
                visit.path?.toLowerCase().includes(query) ||
                visit.ip?.toLowerCase().includes(query)
            );
        }

        setFilteredVisits(result);
    }, [visits, searchQuery]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp.seconds * 1000);
        return new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'medium'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900">Analytics</h1>
                <p className="text-slate-500">Traffic insights and visitor tracking</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Visits</p>
                        <h3 className="text-2xl font-bold text-slate-900">{visits.length}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Unique Visitors</p>
                        <h3 className="text-2xl font-bold text-slate-900">{uniqueVisitors}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl text-green-600">
                        <Globe className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Today's Visits</p>
                        <h3 className="text-2xl font-bold text-slate-900">{todaysVisits}</h3>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traffic Trend */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Traffic Trend (Last 7 Days)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyStats}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="visits"
                                    stroke="#ea580c"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorVisits)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Device Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Device / Platform</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={platformStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {platformStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Pages */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Top Visited Pages</h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pageStats} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tick={{ fill: '#64748b', fontSize: 13 }}
                                width={100}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="visits" fill="#ea580c" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
                    <div className="max-w-xs relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Filter timeline..."
                            className="pl-9 h-10 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {filteredVisits.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Globe className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No visits found</h3>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4">Visitor Details</th>
                                        <th className="px-6 py-4">Page</th>
                                        <th className="px-6 py-4">Source</th>
                                        <th className="px-6 py-4 text-right">IP Address</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredVisits.map((visit) => (
                                        <tr key={visit.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                                {formatDate(visit.timestamp)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-xs text-slate-500" title={visit.visitorId}>
                                                        {visit.visitorId?.substring(0, 8)}...
                                                    </span>
                                                    <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                        {visit.platform?.includes('Mobile') ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                                                        {visit.platform}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
                                                    {visit.path}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate" title={visit.referrer}>
                                                {visit.referrer || 'Direct'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">
                                                {visit.ip}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
