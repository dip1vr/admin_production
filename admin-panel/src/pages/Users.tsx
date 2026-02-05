
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Loader2, Users as UsersIcon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface User {
    id: string;
    email: string;
    bookingsCount?: number;
    totalSpend?: number;
    lastBookingAt?: any;
    createdAt?: any;
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const fetchedUsers: User[] = [];
            querySnapshot.forEach((doc) => {
                fetchedUsers.push({ id: doc.id, ...doc.data() } as User);
            });
            // Sort by total spend desc
            fetchedUsers.sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0));

            setUsers(fetchedUsers);
            setFilteredUsers(fetchedUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        let result = users;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(u =>
                u.email?.toLowerCase().includes(query) ||
                u.id.toLowerCase().includes(query)
            );
        }

        setFilteredUsers(result);
    }, [users, searchQuery]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900">Users</h1>
                    <p className="text-slate-500">Registered customers</p>
                </div>
            </div>

            <div className="max-w-sm relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Search users..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <UsersIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No users found</h3>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">User ID</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4 text-center">Bookings</th>
                                    <th className="px-6 py-4 text-right">Total Spend</th>
                                    <th className="px-6 py-4 text-right">Last Active</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{user.id}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{user.email}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold">
                                                {user.bookingsCount || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            {user.totalSpend ? `₹${user.totalSpend.toLocaleString()}` : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500">
                                            {user.lastBookingAt ? new Date(user.lastBookingAt.seconds * 1000).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
