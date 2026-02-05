import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2, Upload, Save, Utensils, Wine, Image as ImageIcon, Type } from 'lucide-react';

const IMGBB_API_KEY = "87ac08b1fe96f1eec8ec5a764548dd56";

interface DiningContent {
    main: string;
    food: string;
    drink: string;
    title: string;
    subtitle: string;
    description: string;
    openingHours: string;
    signatureDishes: string;
}

const DEFAULT_CONTENT: DiningContent = {
    main: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop",
    food: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=2067&auto=format&fit=crop",
    drink: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1740&auto=format&fit=crop",
    title: "Dining Experience",
    subtitle: "Culinary Delights",
    description: "Savor the authentic flavors of Rajasthan and global cuisines crafted by master chefs",
    openingHours: "Breakfast: 7AM - 11AM • Dinner: 7PM - 11PM",
    signatureDishes: "Dal Baati Churma • Laal Maas • Gatte ki Sabzi"
};

export default function Dining() {
    const [content, setContent] = useState<DiningContent>(DEFAULT_CONTENT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const docRef = doc(db, "content", "dining");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setContent(prev => ({ ...prev, ...docSnap.data() as DiningContent }));
            }
        } catch (error) {
            console.error("Error fetching dining content:", error);
        } finally {
            setLoading(false);
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

    const handleFileChange = async (key: keyof DiningContent, file: File) => {
        setUploading(key);
        try {
            const imageUrl = await uploadToImgBB(file);
            const newContent = { ...content, [key]: imageUrl };
            setContent(newContent);

            // Auto save after upload
            await saveContent(newContent);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload image");
        } finally {
            setUploading(null);
        }
    };

    const saveContent = async (dataToSave: DiningContent) => {
        setSaving(true);
        try {
            await setDoc(doc(db, "content", "dining"), dataToSave);
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-24">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dining Section Control</h1>
                <p className="text-slate-500 mt-1">Manage images and text content for the dining section.</p>
            </div>

            {/* Text Content Section */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                    <Type className="w-5 h-5 text-slate-500" />
                    <h2 className="text-xl font-bold text-slate-800">Text Content</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Section Title</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={content.title}
                            onChange={(e) => setContent({ ...content, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Subtitle</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={content.subtitle}
                            onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-24"
                            value={content.description}
                            onChange={(e) => setContent({ ...content, description: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-slate-700">Opening Hours</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={content.openingHours}
                            onChange={(e) => setContent({ ...content, openingHours: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-slate-700">Signature Dishes</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={content.signatureDishes}
                            onChange={(e) => setContent({ ...content, signatureDishes: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Images Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Main Large Image */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-bold text-slate-800">Main Dining Hall</h2>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group">
                        <div className="aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden relative">
                            <img src={content.main} alt="Main Dining" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    Change Image
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleFileChange('main', e.target.files[0])}
                                        disabled={!!uploading}
                                    />
                                </label>
                            </div>
                            {uploading === 'main' && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 mt-3">This is the large background image for the dining section.</p>
                    </div>
                </div>

                {/* Secondary Images - Side by Side */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Utensils className="w-5 h-5 text-orange-600" />
                        <h2 className="text-lg font-bold text-slate-800">Food Highlight</h2>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group h-full">
                        <div className="aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden relative">
                            <img src={content.food} alt="Food" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    Change Image
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleFileChange('food', e.target.files[0])}
                                        disabled={!!uploading}
                                    />
                                </label>
                            </div>
                            {uploading === 'food' && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 mt-3">The floating image showing a signature dish.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Wine className="w-5 h-5 text-rose-600" />
                        <h2 className="text-lg font-bold text-slate-800">Drink / Detail</h2>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group h-full">
                        <div className="aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden relative">
                            <img src={content.drink} alt="Drink" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    Change Image
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleFileChange('drink', e.target.files[0])}
                                        disabled={!!uploading}
                                    />
                                </label>
                            </div>
                            {uploading === 'drink' && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 mt-3">The smaller floating detail image (e.g. drink or dessert).</p>
                    </div>
                </div>
            </div>

            {/* Manual Save Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => saveContent(content)}
                    disabled={saving || !!uploading}
                    className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl hover:bg-slate-800 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
