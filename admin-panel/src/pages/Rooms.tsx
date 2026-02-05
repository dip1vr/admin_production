
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Loader2, BedDouble } from 'lucide-react';
import { RoomDialog, type Room } from '@/components/rooms/RoomDialog';

export default function Rooms() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "rooms"));
            const fetchedRooms: Room[] = [];
            querySnapshot.forEach((doc) => {
                fetchedRooms.push({ id: doc.id, ...doc.data() } as Room);
            });
            // Client side sort by name or creation if possible
            setRooms(fetchedRooms);
        } catch (error) {
            console.error("Error fetching rooms:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleDelete = async (id: string | undefined) => {
        if (!id) return;
        if (!confirm("Are you sure you want to delete this room? This action cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, "rooms", id));
            fetchRooms(); // Refresh
        } catch (error) {
            console.error("Error deleting room:", error);
            alert("Failed to delete room");
        }
    };

    const handleEdit = (room: Room) => {
        setEditingRoom(room);
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingRoom(null);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900">Rooms Types</h1>
                    <p className="text-slate-500">Manage hotel accommodations</p>
                </div>
                <Button onClick={handleAdd} className="bg-slate-900 text-white hover:bg-orange-600">
                    <Plus className="w-5 h-5 mr-2" /> Add Room
                </Button>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                </div>
            ) : rooms.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <BedDouble className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No rooms found</h3>
                    <p className="text-slate-500 mb-6">Start by creating your first room category.</p>
                    <Button onClick={handleAdd} variant="outline">Create Room</Button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Image</th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Price</th>
                                    <th className="px-6 py-4">Stock</th>
                                    <th className="px-6 py-4">Size</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rooms.map((room) => (
                                    <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="w-16 h-12 bg-slate-100 rounded-lg overflow-hidden relative">
                                                {room.image && <img src={room.image} alt={room.name} className="w-full h-full object-cover" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{room.name}</td>
                                        <td className="px-6 py-4 font-bold text-orange-600">{room.price}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-bold">
                                                {room.totalStock ?? 5}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{room.size}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(room)}>
                                                    <Pencil className="w-4 h-4 text-slate-500" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(room.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <RoomDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                roomToEdit={editingRoom}
                onSuccess={() => {
                    fetchRooms();
                    setIsDialogOpen(false);
                }}
            />
        </div>
    );
}
