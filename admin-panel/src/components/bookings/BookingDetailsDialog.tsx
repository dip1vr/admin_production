
import { Button } from '@/components/ui/button';
import { X, Calendar, User, MapPin, CreditCard, XCircle, CheckCircle, Eye } from 'lucide-react';
import { updateDoc, doc, collection, query, where, getDocs, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState } from 'react';

// Reuse Booking interface or define shared one. 
// Defined in Dashboard.tsx currently, better to move to types.ts but for now copy/extend.
export interface Booking {
    id: string;
    bookingId?: string;
    guest: { name: string; email: string; phone?: string };
    room: { name: string; image?: string; basePricePerNight?: number; status?: string };
    stay: { checkIn: string; checkOut: string; totalNights: number; adults: number; children: number; roomsCount: number };
    payment: {
        totalAmount: number;
        status: string;
        method?: string;
        advanceAmount?: number;
        pendingAmount?: number;
        paidAmount?: number;
        type?: string;
        currency?: string;
        screenshotUrl?: string;
    };
    status: string;
    createdAt: any;
}

interface BookingDetailsDialogProps {
    booking: Booking | null;
    open: boolean; // Renamed from isOpen to match some standard, or stick to isOpen. Let's use open.
    onClose: () => void;
    onUpdate: () => void;
}

export function BookingDetailsDialog({ booking, open, onClose, onUpdate }: BookingDetailsDialogProps) {
    const [updating, setUpdating] = useState(false);

    if (!open || !booking) return null;

    // Helper to update availability
    const restoreAvailability = async () => {
        try {
            if (!booking.room?.name || !booking.stay?.checkIn || !booking.stay?.checkOut) return;

            // 1. Find Room ID
            const roomsQuery = query(collection(db, "rooms"), where("name", "==", booking.room.name));
            const roomsSnapshot = await getDocs(roomsQuery);

            if (roomsSnapshot.empty) {
                console.error("Room not found for availability update");
                return;
            }

            const roomId = roomsSnapshot.docs[0].id;
            const roomsCount = Number(booking.stay.roomsCount) || 1;

            // 2. Iterate dates
            let currentDate = new Date(booking.stay.checkIn);
            const endDate = new Date(booking.stay.checkOut);

            while (currentDate < endDate) {
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                // 3. Update Availability Doc
                // Path: rooms/{roomId}/availability/{dateStr}
                const availabilityRef = doc(db, "rooms", roomId, "availability", dateStr);

                // Use increment(-roomsCount) to decrease booked count
                await updateDoc(availabilityRef, {
                    bookedCount: increment(-roomsCount)
                }).catch(err => {
                    console.log(`No availability doc for ${dateStr}, skipping or handling error:`, err);
                });

                // Next day
                currentDate.setDate(currentDate.getDate() + 1);
            }

        } catch (error) {
            console.error("Error restoring availability:", error);
        }
    };

    const handleVerifyPayment = async () => {
        if (!confirm("Are you sure you want to verify this payment?")) return;
        setUpdating(true);
        try {
            await updateDoc(doc(db, "bookings", booking.id), {
                status: "confirmed",
                "payment.status": "verified",
                "room.status": "booked"
            });
            onUpdate();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to verify payment");
        } finally {
            setUpdating(false);
        }
    };

    const handleRejectPayment = async () => {
        if (!confirm("Are you sure you want to reject this payment and cancel the booking?")) return;
        setUpdating(true);
        try {
            await updateDoc(doc(db, "bookings", booking.id), {
                status: "cancelled",
                "payment.status": "rejected",
                "room.status": "available"
            });
            await restoreAvailability();
            onUpdate();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to reject payment");
        } finally {
            setUpdating(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;
        setUpdating(true);
        try {
            await updateDoc(doc(db, "bookings", booking.id), {
                status: "cancelled",
                "room.status": "available"
            });
            await restoreAvailability();
            onUpdate();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to cancel booking");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10 flex-none">
                    <div>
                        <h2 className="text-xl font-bold font-serif text-slate-900">Booking Details</h2>
                        <p className="text-sm text-slate-500">ID: {booking.bookingId || booking.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8 overflow-y-auto flex-1">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                (booking.status === 'verification_pending' || booking.status === 'pending') ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-slate-100 text-slate-700'
                            }`}>
                            {booking.status === 'verification_pending' || booking.status === 'pending' ? 'Verification Pending' : booking.status}
                        </span>
                        <span className="text-slate-500 text-sm">
                            Booked on: {new Date(booking.createdAt?.seconds * 1000).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Guest Info */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" /> Guest Information
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Name</span>
                                    <span className="font-medium text-slate-900">{booking.guest?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Email</span>
                                    <span className="font-medium text-slate-900">{booking.guest?.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Phone</span>
                                    <span className="font-medium text-slate-900">{booking.guest?.phone || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stay Info */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" /> Stay Details
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Check In</span>
                                    <span className="font-medium text-slate-900">{booking.stay?.checkIn}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Check Out</span>
                                    <span className="font-medium text-slate-900">{booking.stay?.checkOut}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                                    <span className="text-slate-500">Duration</span>
                                    <span className="font-medium text-slate-900">{booking.stay?.totalNights} Night(s)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Room & Payment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400" /> Room Info
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Room Type</span>
                                    <span className="font-medium text-slate-900">{booking.room?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Rooms Count</span>
                                    <span className="font-medium text-slate-900">{booking.stay?.roomsCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Guests</span>
                                    <span className="font-medium text-slate-900">{booking.stay?.adults} Adults, {booking.stay?.children} Kids</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-slate-400" /> Payment
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Total Amount</span>
                                    <span className="font-bold text-slate-900 text-base">₹{booking.payment?.totalAmount?.toLocaleString()}</span>
                                </div>
                                {booking.payment?.advanceAmount !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Advance Paid</span>
                                        <span className="font-medium text-green-600">₹{booking.payment?.advanceAmount?.toLocaleString()}</span>
                                    </div>
                                )}
                                {booking.payment?.pendingAmount !== undefined && booking.payment?.pendingAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Pending</span>
                                        <span className="font-medium text-red-600">₹{booking.payment?.pendingAmount?.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Status</span>
                                    <span className="font-medium capitalize text-slate-900">{booking.payment?.status}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Method</span>
                                    <span className="font-medium capitalize text-slate-900">{booking.payment?.method || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Screenshot */}
                    {booking.payment?.screenshotUrl && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-4 h-4 text-slate-400" /> Payment Screenshot
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <a href={booking.payment.screenshotUrl} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-lg border border-slate-200">
                                    <img
                                        src={booking.payment.screenshotUrl}
                                        alt="Payment Screenshot"
                                        className="w-full h-auto max-h-[400px] object-contain bg-white"
                                    />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-sm font-medium flex items-center gap-2">
                                            <Eye className="w-4 h-4" /> View Full Image
                                        </span>
                                    </div>
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="border-t border-slate-100 bg-slate-50 p-4 flex flex-wrap gap-4 justify-end flex-none">
                    {(booking.status === 'verification_pending' || booking.status === 'pending') && (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleRejectPayment}
                                disabled={updating}
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject & Cancel
                            </Button>
                            <Button
                                onClick={handleVerifyPayment}
                                disabled={updating}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Verify & Confirm
                            </Button>
                        </>
                    )}

                    {booking.status === 'cancelled' && (
                        <Button
                            onClick={handleVerifyPayment}
                            disabled={updating}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Re-Confirm Booking
                        </Button>
                    )}

                    {booking.status !== 'cancelled' && booking.status !== 'verification_pending' && booking.status !== 'pending' && (
                        <Button variant="destructive" onClick={handleCancel} disabled={updating} className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none shadow-none bg-white">
                            <XCircle className="w-4 h-4 mr-2" />
                            {updating ? "Cancelling..." : "Cancel Booking"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
