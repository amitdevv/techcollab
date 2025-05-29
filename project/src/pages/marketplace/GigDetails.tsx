import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Star,
  Heart,
  Share2,
  Calendar,
  MapPin,
  User,
  Bell,
  CheckCircle,
  Award,
  Briefcase,
  MessageCircle,
  Eye,
  Users,
  Package,
  Shield,
  Zap,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Tag,
  Globe,
  BookOpen,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { gigApi, Gig } from '../../services/gigApi';
import { notificationApi } from '../../services/notificationApi';
import { createOrGetChat } from '../../services/inboxApi';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDistanceToNow } from '../../lib/utils';
import toast from 'react-hot-toast';

const GigDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [gig, setGig] = useState<Gig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContactingFreelancer, setIsContactingFreelancer] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchGig = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const gigData = await gigApi.getGigById(id);
        setGig(gigData);
      } catch (error) {
        console.error('Error fetching gig:', error);
        toast.error('Failed to load gig details');
      } finally {
        setLoading(false);
      }
    };

    fetchGig();
  }, [id]);

  // Handle delete gig
  const handleDeleteGig = async () => {
    if (!gig || !id) return;

    if (window.confirm(`Are you sure you want to delete "${gig.title}"? This action cannot be undone.`)) {
      try {
        await gigApi.deleteGig(id);
        toast.success('Gig deleted successfully');
        navigate('/marketplace');
      } catch (error) {
        console.error('Error deleting gig:', error);
        toast.error('Failed to delete gig');
      }
    }
  };

  // Check if user can edit/delete gig
  const canEditGig = () => {
    return user && gig && (user._id === gig.freelancer?._id || user.id === gig.freelancer?._id);
  };

  const handleContactFreelancer = async () => {
    if (!gig || !user || !gig.freelancer) {
      toast.error('Please log in to contact the freelancer');
      return;
    }

    if (user.id === gig.freelancer._id) {
      toast.error('You cannot contact yourself');
      return;
    }

    try {
      setIsContactingFreelancer(true);
      const chat = await createOrGetChat(gig.freelancer._id, gig._id || gig.id);
      navigate(`/inbox/${chat.id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat with freelancer');
    } finally {
      setIsContactingFreelancer(false);
    }
  };

  const handleCreateNotification = async () => {
    if (!gig || !user || !gig._id) {
      toast.error('Please log in to create notifications');
      return;
    }

    try {
      await notificationApi.sendGigInterest(gig._id);
      toast.success('Interest notification sent to freelancer');
    } catch (error) {
      console.error('Error sending interest notification:', error);
      toast.error('Failed to send notification');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-dark-buttonBg/20 dark:to-dark-buttonBg/30 rounded-full w-fit mx-auto mb-4">
            <Package className="h-16 w-16 text-emerald-500 dark:text-dark-button" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-2">Loading...</h3>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 dark:border-dark-button mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 rounded-full w-fit mx-auto mb-4">
            <Package className="h-16 w-16 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-2">Gig not found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">The gig you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/marketplace')} className="bg-gradient-to-r from-violet-500 to-purple-600 dark:from-dark-button dark:to-dark-button">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-violet-400/20 to-purple-600/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 bg-white/80 dark:bg-dark-buttonBg/80 backdrop-blur-sm border-violet-200 dark:border-dark-buttonBg hover:bg-violet-50 dark:hover:bg-dark-buttonBg/60 rounded-xl shadow-md text-gray-900 dark:text-dark-text"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Button>
          <div className="flex items-center gap-3">
            {canEditGig() && (
              <>
                <Link to={`/marketplace/${id}/edit`}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/80 dark:bg-dark-buttonBg/80 backdrop-blur-sm border-emerald-200 dark:border-dark-buttonBg hover:bg-emerald-50 dark:hover:bg-dark-buttonBg/60 rounded-xl shadow-md text-emerald-700 dark:text-dark-button"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Gig
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDeleteGig}
                  className="bg-white/80 dark:bg-dark-buttonBg/80 backdrop-blur-sm border-red-200 dark:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl shadow-md text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsFavorited(!isFavorited)}
              className={`bg-white/80 dark:bg-dark-buttonBg/80 backdrop-blur-sm border-violet-200 dark:border-dark-buttonBg hover:bg-violet-50 dark:hover:bg-dark-buttonBg/60 rounded-xl shadow-md ${
                isFavorited ? 'text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-300' : 'text-gray-700 dark:text-dark-text'
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 dark:fill-red-400' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white/80 dark:bg-dark-buttonBg/80 backdrop-blur-sm border-violet-200 dark:border-dark-buttonBg hover:bg-violet-50 dark:hover:bg-dark-buttonBg/60 rounded-xl shadow-md text-gray-700 dark:text-dark-text"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-[#171717]/90 backdrop-blur-md rounded-2xl overflow-hidden">
              <div className="relative p-8 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-0 shadow-lg rounded-md">
                    <Award className="h-3 w-3 mr-1" />
                    Top Rated
                  </Badge>
                  <Badge className="bg-white/90 dark:bg-dark-buttonBg/90 backdrop-blur-sm text-violet-600 dark:text-dark-button border-0 shadow-lg rounded-md">
                    <Eye className="h-3 w-3 mr-1" />
                    {gig.views || 245} views
                  </Badge>
                  <Badge className="bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-violet-700 dark:text-dark-button border-0 shadow-lg rounded-md capitalize">
                    {gig.category}
                  </Badge>
                </div>
                
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-dark-text mb-4 leading-tight">{gig.title}</h1>
                
                <div className="flex items-center gap-6 text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                    <span className="font-semibold text-lg">{gig.rating.toFixed(1)}</span>
                    <span className="text-sm">({gig.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span className="text-sm">{gig.orders || 0} orders completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm">{gig.deliveryTime || "7 days"} delivery</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={gig.freelancer?.picture}
                      alt={gig.freelancer?.name}
                      size="md"
                      className="ring-3 ring-violet-100"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">{gig.freelancer?.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{gig.freelancer?.profile?.location || "Remote"}</span>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full ml-2"></div>
                        <span className="text-emerald-600">Online</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-emerald-600">{formatCurrency(gig.price)}</div>
                    <div className="text-sm text-gray-500">Starting at</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Description Section */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-b border-violet-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl">About This Gig</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{gig.description}</p>
                </div>
                
                {/* Tags */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Skills & Technologies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {gig.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border-violet-200/50 hover:from-violet-100 hover:to-purple-100 transition-all duration-300 cursor-pointer transform hover:scale-105 rounded-xl px-3 py-1.5"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Freelancer Profile */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl">About the Freelancer</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar
                    src={gig.freelancer?.picture}
                    alt={gig.freelancer?.name}
                    size="lg"
                    className="ring-4 ring-emerald-100"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                      {gig.freelancer?.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{gig.freelancer?.profile?.location || "Remote"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <span>Online now</span>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">
                      Experienced professional ready to help with your project. Contact for more details about their expertise and background.
                    </p>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-lg text-emerald-600">4.9</div>
                        <div className="text-gray-500">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-emerald-600">156</div>
                        <div className="text-gray-500">Reviews</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-emerald-600">98%</div>
                        <div className="text-gray-500">Response Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-[#171717]/90 backdrop-blur-md rounded-2xl overflow-hidden sticky top-6">
              <CardHeader className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-900/20 dark:to-purple-900/20 border-b border-violet-100/50 dark:border-dark-buttonBg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl dark:text-dark-text">Pricing</CardTitle>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-violet-600 dark:text-dark-button">
                      {formatCurrency(gig.price)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Starting at</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Package Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-buttonBg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Delivery Time</span>
                    </div>
                    <span className="font-medium text-gray-800 dark:text-dark-text">{gig.deliveryTime || "7 days"}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-buttonBg">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Category</span>
                    </div>
                    <span className="font-medium text-gray-800 dark:text-dark-text">{gig.category}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-buttonBg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Sub-Category</span>
                    </div>
                    <span className="font-medium text-gray-800 dark:text-dark-text">{gig.subCategory}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Orders Completed</span>
                    </div>
                    <span className="font-medium text-gray-800 dark:text-dark-text">{gig.orders || 0}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 py-3 text-base font-semibold"
                    onClick={() => toast.success('Order feature coming soon!')}
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    Order Now
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleContactFreelancer}
                    disabled={isContactingFreelancer}
                    className="w-full border-violet-200 text-violet-600 hover:bg-violet-50 backdrop-blur-sm py-3 text-base font-medium"
                  >
                    {isContactingFreelancer ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent mr-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Contact Freelancer
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleCreateNotification}
                    className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50 backdrop-blur-sm py-3 text-base font-medium"
                  >
                    <Bell className="h-5 w-5 mr-2" />
                    Send Interest
                  </Button>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Quality Guarantee</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-md rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-amber-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">Gig Statistics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-white/50 rounded-xl">
                    <div className="font-bold text-xl text-amber-600">{gig.views || 245}</div>
                    <div className="text-sm text-gray-600">Views</div>
                  </div>
                  <div className="p-4 bg-white/50 rounded-xl">
                    <div className="font-bold text-xl text-amber-600">{gig.favorites || 43}</div>
                    <div className="text-sm text-gray-600">Favorites</div>
                  </div>
                  <div className="p-4 bg-white/50 rounded-xl">
                    <div className="font-bold text-xl text-amber-600">{gig.orders || 89}</div>
                    <div className="text-sm text-gray-600">Orders</div>
                  </div>
                  <div className="p-4 bg-white/50 rounded-xl">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-xl text-amber-600">{gig.rating.toFixed(1)}</span>
                    </div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Similar Gigs Suggestion */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-blue-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl">Recommended for You</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Discover more amazing gigs in this category</p>
                  <Link to="/marketplace">
                    <Button
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 backdrop-blur-sm"
                    >
                      Browse Similar Gigs
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigDetails;
