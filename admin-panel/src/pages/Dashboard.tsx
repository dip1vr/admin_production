
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CalendarCheck, BedDouble, IndianRupee, Users, Loader2 } from 'lucide-react';

interface DashboardStats {
    totalBookings: number;
    totalRevenue: number;
    totalRooms: number;
    activeUsers: number;
}

interface Booking {
    id: string;
    guest: { name: string; email: string };
    room: { name: string };
    payment: { totalAmount: number; status: string };
    status: string;
    createdAt: any;
    stay?: {
        checkIn: string;
        checkOut: string;
        roomsCount: number;
    };
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalBookings: 0,
        totalRevenue: 0,
        totalRooms: 0,
        activeUsers: 0
    });
    const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
    const [roomAvailability, setRoomAvailability] = useState<{ id: string; name: string; total: number; available: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch Rooms to get stock limits
            const roomsSnapshot = await getDocs(collection(db, "rooms"));
            const roomsData = roomsSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                totalStock: doc.data().totalStock || 5 // Default to 5 if not set
            }));
            const totalRooms = roomsData.length; // Count of categories

            // Fetch Bookings
            const bookingsSnapshot = await getDocs(collection(db, "bookings"));
            const totalBookings = bookingsSnapshot.size;

            let totalRevenue = 0;
            const bookings: Booking[] = [];

            // Calculate today's availability
            // Get today's date in YYYY-MM-DD format for comparison
            // Note: Use local date to match how usually dates differ
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;

            const bookedCounts: Record<string, number> = {};

            bookingsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.status !== 'cancelled' && (data.payment?.status === 'paid' || data.payment?.status === 'verified')) {
                    totalRevenue += (data.payment.totalAmount || 0);
                }

                // Active Booking Logic: CheckIn <= Today < CheckOut
                // Note: data.stay.checkIn and checkOut are strings YYYY-MM-DD
                if (data.status !== 'cancelled' && data.stay?.checkIn && data.stay?.checkOut) {
                    // Check if today falls within the booking range (inclusive of checkIn, exclusive of checkOut)
                    if (data.stay.checkIn <= todayStr && data.stay.checkOut > todayStr) {
                        const roomName = data.room?.name;
                        if (roomName) {
                            // Ensure roomsCount is treated as a number
                            const count = Number(data.stay.roomsCount) || 1;
                            bookedCounts[roomName] = (bookedCounts[roomName] || 0) + count;
                        }
                    }
                }

                bookings.push({ id: doc.id, ...data } as Booking);
            });

            // Calculate active rooms availability
            const availability = roomsData.map(room => {
                const booked = bookedCounts[room.name] || 0;
                return {
                    id: room.id,
                    name: room.name,
                    total: room.totalStock,
                    available: Math.max(0, room.totalStock - booked)
                };
            });
            setRoomAvailability(availability);

            // Sort manually if index not present for recent
            bookings.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setRecentBookings(bookings.slice(0, 5));

            setStats({
                totalBookings,
                totalRevenue,
                totalRooms,
                activeUsers: 0
            });

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Revenue"
                    value={`₹${stats.totalRevenue.toLocaleString()}`}
                    icon={IndianRupee}
                    description="Total earnings from bookings"
                />
                <StatsCard
                    title="Total Bookings"
                    value={stats.totalBookings}
                    icon={CalendarCheck}
                    description="All time bookings"
                />
                <StatsCard
                    title="Room Types"
                    value={stats.totalRooms}
                    icon={BedDouble}
                    description="Total room categories"
                />

                {/* Available Rooms Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Available Today</h3>
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <BedDouble className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-3 overflow-y-auto max-h-32 pr-2 custom-scrollbar">
                        {roomAvailability.map(room => (
                            <div key={room.id} className="flex justify-between items-center text-sm">
                                <span className="text-slate-700 truncate max-w-[120px]" title={room.name}>{room.name}</span>
                                <div className="flex items-center gap-1">
                                    <span className={`font-bold ${room.available === 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                        {room.available}
                                    </span>
                                    <span className="text-slate-400 text-xs">/ {room.total}</span>
                                </div>
                            </div>
                        ))}
                        {roomAvailability.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-2">No room types found</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">Recent Bookings</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Booking ID</th>
                                <th className="px-6 py-4">Guest</th>
                                <th className="px-6 py-4">Room</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        No bookings found
                                    </td>
                                </tr>
                            ) : (
                                recentBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{booking.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{booking.guest?.name || 'N/A'}</div>
                                            <div className="text-xs text-slate-400">{booking.guest?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{booking.room?.name}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">₹{booking.payment?.totalAmount?.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                                                booking.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                                                    (booking.status === 'verification_pending' || booking.status === 'pending') ? 'bg-yellow-50 text-yellow-700' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {booking.status === 'verification_pending' || booking.status === 'pending' ? 'Verification Pending' : booking.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
