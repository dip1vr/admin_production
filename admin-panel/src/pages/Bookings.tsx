
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarCheck, Eye, Search } from 'lucide-react';
import { BookingDetailsDialog, type Booking } from '@/components/bookings/BookingDetailsDialog';
import { Input } from '@/components/ui/input';

export default function Bookings() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled' | 'pending'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "bookings"));
            const fetchedBookings: Booking[] = [];
            querySnapshot.forEach((doc) => {
                fetchedBookings.push({ id: doc.id, ...doc.data() } as Booking);
            });
            // Sort by date desc
            fetchedBookings.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            setBookings(fetchedBookings);
            setFilteredBookings(fetchedBookings);
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        let result = bookings;

        // Filter by Status
        if (statusFilter !== 'all') {
            if (statusFilter === 'pending') {
                result = result.filter(b => b.status === 'verification_pending' || b.status === 'pending');
            } else {
                result = result.filter(b => b.status === statusFilter);
            }
        }

        // Filter by Search (ID or Guest Name)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(b =>
                (b.bookingId || b.id).toLowerCase().includes(query) ||
                b.guest?.name?.toLowerCase().includes(query)
            );
        }

        setFilteredBookings(result);
    }, [bookings, statusFilter, searchQuery]);


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900">Bookings</h1>
                    <p className="text-slate-500">Manage customer reservations</p>
                </div>
                {/* Could add export button here */}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search by ID or Guest Name..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setStatusFilter('all')}
                    >
                        All
                    </Button>
                    <Button
                        variant={statusFilter === 'pending' ? 'default' : 'outline'}
                        className={statusFilter === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''}
                        onClick={() => setStatusFilter('pending')}
                    >
                        Pending
                    </Button>
                    <Button
                        variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
                        className={statusFilter === 'confirmed' ? 'bg-green-600 hover:bg-green-700' : ''}
                        onClick={() => setStatusFilter('confirmed')}
                    >
                        Confirmed
                    </Button>
                    <Button
                        variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
                        className={statusFilter === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : ''}
                        onClick={() => setStatusFilter('cancelled')}
                    >
                        Cancelled
                    </Button>
                </div>
            </div>

            {
                loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <CalendarCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No bookings found</h3>
                        <p className="text-slate-500">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Guest</th>
                                        <th className="px-6 py-4">Room</th>
                                        <th className="px-6 py-4">Check In</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{booking.bookingId || booking.id.substring(0, 8)}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{booking.guest?.name}</td>
                                            <td className="px-6 py-4 text-slate-600">{booking.room?.name}</td>
                                            <td className="px-6 py-4 text-slate-600">{booking.stay?.checkIn}</td>
                                            <td className="px-6 py-4 font-bold text-slate-900">₹{booking.payment?.totalAmount?.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                                                    booking.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                                                        (booking.status === 'verification_pending' || booking.status === 'pending') ? 'bg-yellow-50 text-yellow-700' :
                                                            'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {booking.status === 'verification_pending' || booking.status === 'pending' ? 'Verification Pending' : booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button size="icon" variant="ghost" onClick={() => setSelectedBooking(booking)}>
                                                    <Eye className="w-4 h-4 text-slate-500" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            <BookingDetailsDialog
                booking={selectedBooking}
                open={!!selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onUpdate={() => {
                    fetchBookings();
                    // Keep dialog open or close? Usually close if status changed or just refresh data.
                    // onClose(); // Let's keep it open to show updated status or close it. 
                    // The dialog handles status update internally but doesn't auto-refresh the prop.
                    // So we should probably refresh the list and maybe re-select the booking from the new list if we want to keep it open.
                    // Simpler: Close dialog.
                    setSelectedBooking(null);
                }}
            />
        </div >
    );
}
