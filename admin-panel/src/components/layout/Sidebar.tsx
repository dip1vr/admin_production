import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BedDouble, CalendarCheck, Users, LogOut, Hotel, Images, Utensils, MessageSquare, X, MessageCircle, Info, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/rooms', icon: BedDouble, label: 'Rooms' },
    { to: '/bookings', icon: CalendarCheck, label: 'Bookings' },
    { to: '/reviews', icon: MessageSquare, label: 'Reviews' },
    { to: '/gallery', icon: Images, label: 'Gallery' },
    { to: '/about', icon: Info, label: 'About' },
    { to: '/dining', icon: Utensils, label: 'Dining' },
    { to: '/users', icon: Users, label: 'Users' },
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/site-visits', icon: Globe, label: 'Site Visits' },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
    const [unreadChatsCount, setUnreadChatsCount] = useState(0);

    useEffect(() => {
        // Listen for pending bookings
        const bookingsQuery = query(
            collection(db, "bookings"),
            where("status", "in", ["pending", "verification_pending"])
        );

        const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
            setPendingBookingsCount(snapshot.size);
        });

        // Listen for unread chats
        // Assumes 'chats' collection documents have 'unreadCount' > 0 field
        const chatsQuery = query(
            collection(db, "chats"),
            where("unreadCount", ">", 0)
        );

        const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
            setUnreadChatsCount(snapshot.size);
        });

        return () => {
            unsubscribeBookings();
            unsubscribeChats();
        };
    }, []);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-50 transition-transform duration-200 lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-600 p-2 rounded-lg">
                            <Hotel className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-none">Admin Panel</h1>
                            <p className="text-xs text-slate-400 mt-1">Hotel Booking</p>
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const showDot = (item.label === 'Bookings' && pendingBookingsCount > 0) ||
                            (item.label === 'Chat' && unreadChatsCount > 0);

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => window.innerWidth < 1024 && onClose()} // Close on navigate (mobile)
                                className={({ isActive }) => cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium relative",
                                    isActive
                                        ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="flex-1">{item.label}</span>
                                {showDot && (
                                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={() => signOut(auth)}
                        className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all text-sm font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
