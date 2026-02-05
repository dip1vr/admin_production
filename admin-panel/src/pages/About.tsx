import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Loader2, Trash2, Upload, Plus, X, Image as ImageIcon, Info } from 'lucide-react';

interface GalleryImage {
    id: string;
    src: string;
    alt: string;
    createdAt: any;
}

const IMGBB_API_KEY = "87ac08b1fe96f1eec8ec5a764548dd56";

export default function About() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [alt, setAlt] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "about_gallery"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedImages: GalleryImage[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as GalleryImage));
            setImages(fetchedImages);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching about images:", error);
            alert("Failed to load images");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
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

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            alert("Please select an image");
            return;
        }
        if (!alt.trim()) {
            alert("Please enter specific alt text for accessibility");
            return;
        }

        setUploading(true);
        try {
            // 1. Upload to ImgBB
            const imageUrl = await uploadToImgBB(file);

            // 2. Save to Firestore
            await addDoc(collection(db, "about_gallery"), {
                src: imageUrl,
                alt,
                createdAt: serverTimestamp(),
            });

            alert("Image uploaded successfully");
            closeModal();
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload image: " + (error as Error).message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this image?")) return;

        try {
            await deleteDoc(doc(db, "about_gallery", id));
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete image");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFile(null);
        setPreview(null);
        setAlt('');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">About Section Images</h1>
                    <p className="text-slate-500 mt-1">Manage images displayed in the About section of the website.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Image
                </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                    The website displays the <strong>4 most recent images</strong> in the About section grid.
                    Ensure you have at least 4 images for the best layout.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {images.map((image, index) => (
                        <div key={image.id} className="group relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            {index < 4 && (
                                <div className="absolute top-2 left-2 z-10 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                    Displaying
                                </div>
                            )}
                            <div className="aspect-[4/3] relative">
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handleDelete(image.id)}
                                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-sm text-slate-600 truncate" title={image.alt}>{image.alt}</p>
                            </div>
                        </div>
                    ))}

                    {images.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No images found.</p>
                            <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 hover:underline mt-2">
                                Upload an image
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Add About Image</h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="p-6 space-y-4">
                            {/* Image Preview */}
                            <div className="w-full aspect-video bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                                {preview ? (
                                    <>
                                        <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-white text-sm font-medium">Click to change</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">Click to upload image</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Alt Text</label>
                                <input
                                    type="text"
                                    value={alt}
                                    onChange={(e) => setAlt(e.target.value)}
                                    placeholder="e.g. Temple View"
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || !file}
                                    className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        'Add Image'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
