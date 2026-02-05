
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Trash2, Calendar, User, MapPin, Star } from 'lucide-react';

interface Review {
    id: string;
    text?: string;
    content?: string;
    userName?: string;
    userImage?: string;
    location?: string;
    rating?: number;
    createdAt?: any;
    images?: string[];
    userId?: string;
}

export default function Reviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Reviews
            const reviewsSnap = await getDocs(collection(db, "reviews"));
            const fetchedReviews: Review[] = [];
            reviewsSnap.forEach((doc) => {
                fetchedReviews.push({ id: doc.id, ...doc.data() } as Review);
            });

            // Sort by createdAt desc
            fetchedReviews.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });
            setReviews(fetchedReviews);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        try {
            await deleteDoc(doc(db, "reviews", id));
            setReviews(reviews.filter(r => r.id !== id));
        } catch (error) {
            console.error("Error deleting review:", error);
            alert("Failed to delete review");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900">Reviews</h1>
                    <p className="text-slate-500">Manage user reviews and testimonials</p>
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <MessageSquare className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No reviews found</h3>
                    <p className="text-slate-500">Reviews from users will appear here.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Rating</th>
                                    <th className="px-6 py-4">Image</th>
                                    <th className="px-6 py-4 w-1/3">Content</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-slate-500">
                                                    {review.userImage ? (
                                                        <img src={review.userImage} alt={review.userName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4" />
                                                    )}
                                                </div>
                                                {review.userName || "Unknown User"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                {review.location || "General"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                <span className="font-medium text-slate-900">{review.rating || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {review.images && review.images.length > 0 ? (
                                                <div className="w-16 h-12 bg-slate-100 rounded-lg overflow-hidden">
                                                    <img src={review.images[0]} alt="Review" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                                                    <MessageSquare className="w-6 h-6" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <p className="line-clamp-2">{review.text || review.content || "No content"}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {review.createdAt?.toDate ? new Date(review.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(review.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
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
