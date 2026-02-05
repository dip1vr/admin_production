
import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, User, MessageCircle, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ChatUser {
    id: string;
    email?: string;
    userName?: string;
    userEmail?: string;
    photoURL?: string;
    lastMessage?: string;
    lastMessageTimestamp?: any;
    unreadCount?: number;
}

interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp: any;
}

export default function Chat() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch Users
    useEffect(() => {
        const q = query(collection(db, "chats"), orderBy("lastMessageTimestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedUsers: ChatUser[] = [];
            snapshot.forEach((doc) => {
                fetchedUsers.push({ id: doc.id, ...doc.data() } as ChatUser);
            });
            setUsers(fetchedUsers);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Messages & Mark as Read
    useEffect(() => {
        if (!selectedUser || !currentUser) return;

        // Mark as Read
        if ((selectedUser.unreadCount || 0) > 0) {
            const chatRef = doc(db, "chats", selectedUser.id);
            updateDoc(chatRef, { unreadCount: 0 }).catch(console.error);
        }

        const chatId = selectedUser.id;
        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() } as Message);
            });
            setMessages(msgs);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        return () => unsubscribe();
    }, [selectedUser, currentUser]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || !currentUser) return;

        const chatId = selectedUser.id;
        const messagesRef = collection(db, "chats", chatId, "messages");

        try {
            await addDoc(messagesRef, {
                text: newMessage,
                sender: "admin",
                timestamp: serverTimestamp(),
            });
            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleDeleteChat = async (e: React.MouseEvent, userId: string) => {
        e.stopPropagation(); // Prevent selecting the chat
        if (!confirm("Are you sure you want to delete this chat? This action cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, "chats", userId));
            // If the deleted chat was selected, deselect it
            if (selectedUser?.id === userId) {
                setSelectedUser(null);
            }
        } catch (error) {
            console.error("Error deleting chat:", error);
            alert("Failed to delete chat");
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Sidebar */}
            <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
                <div className="p-4 border-b border-slate-200">
                    <h2 className="font-bold text-lg mb-4 text-slate-900">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search users..." className="pl-9 bg-white" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                        </div>
                    ) : (
                        users.map((user) => (
                            <div
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className={`group p-4 flex items-center gap-3 cursor-pointer transition-colors relative ${selectedUser?.id === user.id
                                    ? "bg-white border-l-4 border-orange-600 shadow-sm"
                                    : "hover:bg-slate-100 border-l-4 border-transparent"
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden shrink-0">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.email} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-slate-900 truncate pr-6">
                                        {user.userName || user.userEmail || user.email || "Unknown User"}
                                    </h3>
                                    <p className="text-xs text-slate-500 truncate">
                                        {user.lastMessage || "Tap to chat"}
                                    </p>
                                </div>
                                {user.unreadCount ? user.unreadCount > 0 && (
                                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0" />
                                ) : null}

                                <button
                                    onClick={(e) => handleDeleteChat(e, user.id)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete Chat"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50/50">
                {selectedUser ? (
                    <>
                        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">
                                        {selectedUser.userName || selectedUser.userEmail || selectedUser.email}
                                    </h3>
                                    <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        Online
                                    </span>
                                </div>
                            </div>
                            <div></div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <MessageCircle className="w-12 h-12 mb-2 opacity-20" />
                                    <p>No messages yet</p>
                                    <p className="text-sm">Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender === "admin";
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm text-sm ${isMe
                                                    ? "bg-orange-600 text-white rounded-br-none"
                                                    : "bg-white text-slate-900 rounded-bl-none border border-slate-100"
                                                    }`}
                                            >
                                                <p>{msg.text}</p>
                                                <span className={`text-[10px] block text-right mt-1 ${isMe ? "text-orange-200" : "text-slate-400"}`}>
                                                    {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={scrollRef} />
                        </div>

                        <div className="p-4 bg-white border-t border-slate-200">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-slate-50 border-slate-200"
                                />
                                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Select a User</h3>
                        <p>Choose a user from the sidebar to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
