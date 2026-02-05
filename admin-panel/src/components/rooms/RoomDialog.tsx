import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Loader2, Save, Upload } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Room {
    id?: string;
    name: string;
    price: string;
    description: string;
    size: string;
    image: string; // Main image
    images?: string[]; // Gallery images
    amenities?: string[];
    totalStock?: number;
}

interface RoomDialogProps {
    isOpen: boolean;
    onClose: () => void;
    roomToEdit?: Room | null; // If present, we are editing
    onSuccess: () => void;
}

const IMGBB_API_KEY = "87ac08b1fe96f1eec8ec5a764548dd56";

export function RoomDialog({ isOpen, onClose, roomToEdit, onSuccess }: RoomDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Room>({
        name: '',
        price: '',
        description: '',
        size: '',
        image: '',
        images: [],
        amenities: [],
        totalStock: 5
    });
    const [amenitiesStr, setAmenitiesStr] = useState('');
    const [imagesStr, setImagesStr] = useState('');

    // File Upload State
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (roomToEdit) {
            setFormData(roomToEdit);
            setAmenitiesStr(roomToEdit.amenities?.join(', ') || '');
            setImagesStr(roomToEdit.images?.join(',\n') || '');
            setMainImagePreview(roomToEdit.image); // Show existing URL as preview
            setMainImageFile(null);
        } else {
            setFormData({
                name: '',
                price: '',
                description: '',
                size: '',
                image: '',
                images: [],
                amenities: [],
                totalStock: 5
            });
            setAmenitiesStr('');
            setImagesStr('');
            setMainImagePreview(null);
            setMainImageFile(null);
        }
    }, [roomToEdit, isOpen]);

    const handleChange = (field: keyof Room, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setMainImageFile(file);
            setMainImagePreview(URL.createObjectURL(file));
        }
    };

    const uploadToImgBB = async (imageFile: File): Promise<string> => {
        const formData = new FormData();
        formData.append("image", imageFile);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error?.message || "Failed to upload to ImgBB");
        }

        return data.data.url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let finalImageUrl = formData.image;

            // Upload Image if new file selected
            if (mainImageFile) {
                try {
                    finalImageUrl = await uploadToImgBB(mainImageFile);
                } catch (err) {
                    alert("Failed to upload image. Please try again.");
                    setIsLoading(false);
                    return;
                }
            } else if (!finalImageUrl && !roomToEdit) {
                // require image for new rooms if not provided
                alert("Please upload a main image");
                setIsLoading(false);
                return;
            }

            const dataToSave = {
                ...formData,
                image: finalImageUrl,
                updatedAt: serverTimestamp()
            };

            // Remove id from dataToSave
            const { id, ...rest } = dataToSave as any;

            if (roomToEdit && roomToEdit.id) {
                await updateDoc(doc(db, "rooms", roomToEdit.id), rest);
            } else {
                await addDoc(collection(db, "rooms"), {
                    ...rest,
                    createdAt: serverTimestamp()
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving room:", error);
            alert("Failed to save room");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold font-serif text-slate-900">
                        {roomToEdit ? 'Edit Room' : 'Add New Room'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Room Name</label>
                            <Input
                                required
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Deluxe Room"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Price (per night)</label>
                            <Input
                                required
                                value={formData.price}
                                onChange={(e) => handleChange('price', e.target.value)}
                                placeholder="₹3,500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Total Rooms</label>
                            <Input
                                required
                                type="number"
                                min="0"
                                value={formData.totalStock || ''}
                                onChange={(e) => handleChange('totalStock', parseInt(e.target.value) || 0)}
                                placeholder="Total Avail"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Description</label>
                        <textarea
                            required
                            className="w-full flex min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Room details..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Size</label>
                            <Input
                                required
                                value={formData.size}
                                onChange={(e) => handleChange('size', e.target.value)}
                                placeholder="350 sq ft"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Amenities (comma separated)</label>
                            <Input
                                value={amenitiesStr}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setAmenitiesStr(val);
                                    handleChange('amenities', val.split(',').map(s => s.trim()).filter(Boolean));
                                }}
                                placeholder="Wifi, TV, AC"
                            />
                        </div>
                    </div>

                    {/* Main Image Upload Section */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Main Image</label>
                        <div className="flex items-start gap-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-32 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden relative"
                            >
                                {mainImagePreview ? (
                                    <>
                                        <img src={mainImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <p className="text-white text-xs font-semibold">Change</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                        <span className="text-xs text-slate-500">Upload</span>
                                    </>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <Input
                                    value={formData.image}
                                    onChange={(e) => {
                                        handleChange('image', e.target.value);
                                        setMainImagePreview(e.target.value || null);
                                        setMainImageFile(null); // Clear file if manually typing URL
                                    }}
                                    placeholder="Or paste image URL here..."
                                />
                                <p className="text-xs text-slate-500">
                                    Click the box to upload an image from your device, or paste a URL directly.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Gallery Images (comma or new line separated)</label>
                        <textarea
                            className="w-full flex min-h-[60px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                            value={imagesStr}
                            onChange={(e) => {
                                const val = e.target.value;
                                setImagesStr(val);
                                handleChange('images', val.split(/[,\n]/).map(s => s.trim()).filter(Boolean));
                            }}
                            placeholder="https://... , https://..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Room
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
