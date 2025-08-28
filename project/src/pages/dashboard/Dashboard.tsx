import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Calendar,
  MessageSquare,
  Users,
  Star,
  TrendingUp,
  Clock,
  ChevronRight,
  ArrowUpRight,
  MapPin,
  Zap,
  Settings,
  Search,
  CheckCircle,
  PlusCircle,
  FileText,
  DollarSign,
  RefreshCw,
  BarChart3,
  Award,
  Activity,
  Target,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Avatar from "../../components/ui/Avatar";
import { formatCurrency, formatDistanceToNow } from "../../lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { gigApi } from "../../services/gigApi";
import { useUserStats } from "../../hooks/useUserStats";

// Define interfaces for our data types
interface Gig {
  _id: string;
  title: string;
  price: number;
  category: string;
  createdAt: string;
  views: number;
  orders: number;
  rating: number;
  freelancer: {
    _id: string;
    name: string;
    picture?: string;
    status?: string;
  };
}

interface Freelancer {
  _id: string;
  name: string;
  picture?: string;
  title?: string;
  skills?: string[];
  rating?: number;
  reviewCount?: number;
  status?: string;
  activeGigs?: number;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location?: {
    type: string;
    address?: string;
    city?: string;
  };
  attendees?: Array<{
    _id: string;
    name: string;
    picture?: string;
  }>;
  attendeeCount?: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendingGigs, setTrendingGigs] = useState<Gig[]>([]);
  const [topFreelancers, setTopFreelancers] = useState<Freelancer[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState({
    activeProjects: 0,
    totalEarnings: 0,
    successRate: 94
  });

  // Get real user statistics
  const { 
    stats: userStats, 
    isLoading: statsLoading, 
    error: statsError, 
    refreshStats 
  } = useUserStats(user?._id, user?.token);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get appropriate emoji based on time
  const getGreetingEmoji = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "🌅";
    if (hour < 18) return "☀️";
    return "🌙";
  };

  const fetchDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      // Fetch all data in parallel with real API endpoints
      const [gigsResponse, freelancersResponse, eventsResponse] = await Promise.all([
        api.get("/api/gigs/trending?limit=3"),
        api.get("/api/users/top-freelancers?limit=3"),
        api.get("/api/events/upcoming?limit=2"),
      ]);

      setTrendingGigs(gigsResponse.data);
      setTopFreelancers(freelancersResponse.data);
      setUpcomingEvents(eventsResponse.data);

      // Get user's gig analytics for dashboard stats
      if (user?.token) {
        try {
          const analyticsResponse = await gigApi.getGigAnalytics();
          setDashboardStats({
            activeProjects: analyticsResponse.activeGigs || 0,
            totalEarnings: analyticsResponse.totalRevenue || 0,
            successRate: Math.round(analyticsResponse.avgRating * 20) || 94 // Convert 5-star to percentage
          });
        } catch (error) {
          console.error('Error fetching analytics:', error);
          // Use default stats if analytics fail
          setDashboardStats({
            activeProjects: userStats?.activeGigs || 0,
            totalEarnings: 0,
            successRate: 94
          });
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set empty arrays on error
      setTrendingGigs([]);
      setTopFreelancers([]);
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, [user]);

  const handleRefresh = () => {
    fetchDashboardData(true);
    if (refreshStats) {
      refreshStats();
    }
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Enhanced Welcome Header */}
      <div className="bg-gradient-to-br from-[#00aa45]/5 via-[#00aa45]/10 to-[#00aa45]/5 dark:from-[#00aa45]/10 dark:via-[#00aa45]/5 dark:to-[#00aa45]/10 rounded-3xl p-8 shadow-xl border border-[#00aa45]/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00aa45] to-[#009940] rounded-2xl flex items-center justify-center shadow-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {getGreeting()}, {user?.name?.split(" ")[0] || "there"} {getGreetingEmoji()}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    Here's what's happening in your workspace today
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <Badge className="bg-[#00aa45]/20 dark:bg-[#00aa45]/20 text-[#00aa45] dark:text-[#00aa45] border-[#00aa45]/30 dark:border-[#00aa45]/30 px-4 py-2 rounded-xl text-sm font-medium">
                  <Award className="h-4 w-4 mr-2" />
                  Premium Member
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-[#232323]/50 px-3 py-2 rounded-lg">
                  <Clock className="h-4 w-4" />
                  <span>Last updated: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="border-[#00aa45] text-[#00aa45] hover:bg-[#00aa45] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        
        {/* Enhanced background decoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-[#00aa45]/20 to-[#009940]/20 dark:from-[#00aa45]/15 dark:to-[#009940]/15 rounded-full blur-3xl -translate-y-36 translate-x-36"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-[#009940]/20 to-[#00aa45]/20 dark:from-[#009940]/15 dark:to-[#00aa45]/15 rounded-full blur-3xl translate-y-28 -translate-x-28"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-br from-[#00aa45]/10 to-[#009940]/10 dark:from-[#00aa45]/8 dark:to-[#009940]/8 rounded-full blur-2xl -translate-x-16 -translate-y-16"></div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          icon={<PlusCircle className="h-6 w-6" />}
          bgColor="bg-gradient-to-br from-[#00aa45]/10 to-[#009940]/10"
          iconColor="text-[#00aa45]"
          title="Create Gig"
          description="💼 Post a new freelance service"
          onClick={() => navigate("/marketplace/create")}
        />
        <ActionCard
          icon={<Search className="h-6 w-6" />}
          bgColor="bg-gradient-to-br from-blue-500/10 to-indigo-500/10"
          iconColor="text-blue-600"
          title="Browse Gigs"
          description="💸 Find available opportunities"
          onClick={() => navigate("/marketplace")}
        />
        <ActionCard
          icon={<Calendar className="h-6 w-6" />}
          bgColor="bg-gradient-to-br from-purple-500/10 to-pink-500/10"
          iconColor="text-purple-600"
          title="Events"
          description="📅 Join or create events"
          onClick={() => navigate("/events")}
        />
        <ActionCard
          icon={<Users className="h-6 w-6" />}
          bgColor="bg-gradient-to-br from-amber-500/10 to-orange-500/10"
          iconColor="text-amber-600"
          title="Community"
          description="🧑‍🤝‍🧑 Connect with others"
          onClick={() => navigate("/community")}
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-[#333333] rounded-2xl p-6">
        <StatsCard
          title="Active Projects"
          value={dashboardStats.activeProjects.toString()}
          change="+8%"
          positive={true}
          icon={<Target className="h-5 w-5" />}
          description="From last month"
          loading={statsLoading}
        />
        <StatsCard
          title="Total Earnings"
          value={`$${dashboardStats.totalEarnings.toLocaleString()}`}
          change="+15%"
          positive={true}
          icon={<DollarSign className="h-5 w-5" />}
          description="This month"
          loading={statsLoading}
        />
        <StatsCard
          title="Success Rate"
          value={`${dashboardStats.successRate}%`}
          change="+2%"
          positive={true}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Project completion"
          loading={statsLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Trending Gigs */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-200 dark:border-dark-buttonBg shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-100 dark:border-dark-buttonBg bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-[#171717] dark:to-[#171717]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 dark:from-[#219653] dark:to-[#219653] shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900 dark:text-dark-text">Trending Gigs</CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hot opportunities right now</p>
                  </div>
                </div>
                <Link
                  to="/marketplace"
                  className="text-sm font-medium text-green-600 dark:text-[#219653] hover:text-green-700 dark:hover:text-[#219653]/80 flex items-center group transition-colors"
                >
                  View
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <GigSkeleton key={i} />
                  ))}
                </div>
              ) : trendingGigs.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-dark-buttonBg">
                  {trendingGigs.slice(0, 3).map((gig) => (
                    <GigRow key={gig._id} gig={gig} />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-[#171717] rounded-full flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-3">No trending gigs available</p>
                  <Button
                    onClick={() => navigate("/marketplace/create")}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-[#219653] dark:to-[#219653] hover:from-green-600 hover:to-emerald-700 dark:hover:from-[#219653]/90 dark:hover:to-[#219653]/90 text-white shadow-lg"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Post a Gig
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Top Freelancers & Upcoming Events */}
        <div className="space-y-6">
          {/* Top Freelancers This Week */}
          <Card className="border border-gray-200 dark:border-dark-buttonBg shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-100 dark:border-dark-buttonBg bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-[#171717] dark:to-[#171717]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-[#219653] dark:to-[#219653] shadow-lg">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-dark-text">Top Freelancers</CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This week's stars</p>
                  </div>
                </div>
                <Link
                  to="/marketplace"
                  className="text-sm font-medium text-green-600 dark:text-[#219653] hover:text-green-700 dark:hover:text-[#219653]/80 flex items-center group transition-colors"
                >
                  View
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <FreelancerSkeleton key={i} />
                  ))}
                </div>
              ) : topFreelancers.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-dark-buttonBg">
                  {topFreelancers.slice(0, 3).map((freelancer) => (
                    <FreelancerRow key={freelancer._id} freelancer={freelancer} />
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-[#171717] rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No freelancers available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border border-gray-200 dark:border-dark-buttonBg shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-100 dark:border-dark-buttonBg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-[#171717] dark:to-[#171717]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-[#219653] dark:to-[#219653] shadow-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-dark-text">Upcoming Events</CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Don't miss out</p>
                  </div>
                </div>
                <Link
                  to="/events"
                  className="text-sm font-medium text-green-600 dark:text-[#219653] hover:text-green-700 dark:hover:text-[#219653]/80 flex items-center group transition-colors"
                >
                  View
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2].map((i) => (
                    <EventSkeleton key={i} />
                  ))}
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-dark-buttonBg">
                  {upcomingEvents.slice(0, 2).map((event) => (
                    <EventRow key={event._id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-[#171717] rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">No upcoming events</p>
                  <Button
                    onClick={() => navigate("/events/create")}
                    variant="outline"
                    className="border-green-200 dark:border-[#219653] text-green-600 dark:text-[#219653] hover:bg-green-50 dark:hover:bg-[#171717]"
                    size="sm"
                  >
                    <PlusCircle className="mr-1 h-4 w-4" />
                    Create Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Tips Section */}
      <Card className="border border-green-200 dark:border-dark-buttonBg shadow-lg rounded-2xl overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 dark:from-dark-buttonBg/10 dark:to-dark-buttonBg/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 dark:from-[#219653] dark:to-[#219653] shadow-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
                💡 Pro Tip of the Day
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Complete your profile with skills and portfolio samples to increase your visibility by up to 70% and attract more quality projects.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate("/profile")}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-[#219653] dark:to-[#219653] hover:from-green-600 hover:to-emerald-700 dark:hover:from-[#219653]/90 dark:hover:to-[#219653]/90 text-white shadow-lg"
                  size="sm"
                >
                  Complete Profile
                </Button>
                <Button
                  onClick={() => navigate("/settings")}
                  variant="outline"
                  className="border-green-200 dark:border-[#219653] text-green-600 dark:text-[#219653] hover:bg-green-100 dark:hover:bg-dark-buttonBg/20"
                  size="sm"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Action Card Component
const ActionCard = ({
  icon,
  title,
  description,
  onClick,
  bgColor,
  iconColor,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  bgColor: string;
  iconColor: string;
}) => (
  <div
    className="p-6 border-0 hover:border-[#00aa45]/30 transition-all duration-300 hover:shadow-xl cursor-pointer bg-white dark:bg-[#333333] rounded-2xl group transform hover:scale-105 hover:-translate-y-1"
    onClick={onClick}
  >
    <Card className="h-full border-0 shadow-none bg-transparent dark:bg-transparent">
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-xl ${bgColor} ${iconColor} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-[#00aa45] dark:group-hover:text-[#00aa45] transition-colors leading-tight">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Card>
  </div>
);

// Enhanced Stats Card Component
const StatsCard = ({
  title,
  value,
  change,
  positive,
  icon,
  description,
  loading = false,
}: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  description: string;
  loading?: boolean;
}) => (
  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden bg-white dark:bg-[#232323]">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${positive ? 'bg-[#00aa45]/10 dark:bg-[#00aa45]/10' : 'bg-red-500/10 dark:bg-red-500/10'} shadow-lg`}>
            <div className={positive ? 'text-[#00aa45] dark:text-[#00aa45]' : 'text-red-600 dark:text-red-400'}>
              {icon}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
            {loading ? (
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          ) : (
            <>
              <div className={`flex items-center text-sm font-medium ${
                positive ? 'text-[#00aa45] dark:text-[#00aa45]' : 'text-red-600 dark:text-red-400'
              }`}>
                <TrendingUp className={`h-4 w-4 mr-1 ${positive ? '' : 'rotate-180'}`} />
                {change}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            </>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Enhanced Gig Card Row Component
const GigRow = ({ gig }: { gig: Gig }) => (
  <div
    className="p-6 hover:bg-gradient-to-r hover:from-[#00aa45]/5 hover:to-[#009940]/5 dark:hover:from-[#00aa45]/10 dark:hover:to-[#009940]/10 transition-all duration-300 cursor-pointer group"
    onClick={() => window.location.href = `/marketplace/${gig._id}`}
  >
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0">
        <Avatar
          src={gig.freelancer?.picture}
          alt={gig.freelancer?.name || "User"}
          size="md"
          status={gig.freelancer?.status as any}
          className="ring-2 ring-white dark:ring-gray-700 shadow-lg group-hover:ring-[#00aa45]/30 transition-all"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-[#00aa45] dark:group-hover:text-[#00aa45] transition-colors">
          {gig.title}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">by {gig.freelancer?.name}</p>
        <div className="mt-2 flex items-center gap-3">
          <Badge className="bg-gradient-to-r from-[#00aa45]/10 to-[#009940]/10 text-[#00aa45] dark:text-[#00aa45] rounded-md border-[#00aa45]/20 dark:border-[#00aa45]/20 font-medium">
            ${gig.price}
          </Badge>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(gig.createdAt))} ago
          </span>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-600 group-hover:text-[#00aa45] dark:group-hover:text-[#00aa45] group-hover:translate-x-1 transition-all" />
    </div>
  </div>
);

// Enhanced Freelancer Row Component
const FreelancerRow = ({ freelancer }: { freelancer: Freelancer }) => (
  <div
    className="p-4 hover:bg-gradient-to-r hover:from-amber-500/5 hover:to-yellow-500/5 dark:hover:from-amber-500/10 dark:hover:to-yellow-500/10 transition-all duration-300 cursor-pointer group"
    onClick={() => window.location.href = `/profile/${freelancer._id}`}
  >
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0">
        <Avatar
          src={freelancer.picture}
          alt={freelancer.name}
          size="md"
          status={freelancer.status as any}
          className="ring-2 ring-white dark:ring-gray-700 shadow-lg group-hover:ring-amber-200 dark:group-hover:ring-[#00aa45]/30 transition-all"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-amber-700 dark:group-hover:text-[#00aa45] transition-colors">
          {freelancer.name}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {freelancer.title || freelancer.skills?.slice(0, 2).join(", ")}
        </p>
        <div className="mt-1 flex items-center">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < (freelancer.rating || 0)
                    ? "text-yellow-400 dark:text-[#00aa45] fill-yellow-400 dark:fill-[#00aa45]"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              />
            ))}
          </div>
          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
            ({freelancer.reviewCount || 0})
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Enhanced Event Row Component
const EventRow = ({ event }: { event: Event }) => {
  const getLocationDisplay = () => {
    if (event.location?.type === 'online') {
      return 'Online';
    }
    return event.location?.city || event.location?.address || 'TBA';
  };

  return (
    <div
      className="p-4 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-indigo-500/5 dark:hover:from-blue-500/10 dark:hover:to-indigo-500/10 transition-all duration-300 cursor-pointer group"
      onClick={() => window.location.href = `/events/${event._id}`}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/10 dark:to-indigo-500/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-[#00aa45]" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-700 dark:group-hover:text-[#00aa45] transition-colors">
            {event.title}
          </h4>
          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formatDistanceToNow(new Date(event.date))} away</span>
            <MapPin className="h-3 w-3 ml-2 mr-1" />
            <span>{getLocationDisplay()}</span>
          </div>
          {event.attendeeCount && (
            <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
              <Users className="h-3 w-3 mr-1" />
              <span>{event.attendeeCount} attendees</span>
            </div>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-[#00aa45] group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};

// Skeleton Components
const GigSkeleton = () => (
  <div className="p-5 animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="rounded-full bg-gray-200 dark:bg-dark-buttonBg h-10 w-10"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-dark-buttonBg rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-dark-buttonBg rounded w-1/2"></div>
        <div className="flex space-x-2">
          <div className="h-5 bg-gray-200 dark:bg-dark-buttonBg rounded w-16"></div>
          <div className="h-3 bg-gray-200 dark:bg-dark-buttonBg rounded w-20"></div>
        </div>
      </div>
    </div>
  </div>
);

const FreelancerSkeleton = () => (
  <div className="p-4 animate-pulse">
    <div className="flex items-center space-x-3">
      <div className="rounded-full bg-gray-200 dark:bg-dark-buttonBg h-10 w-10"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-dark-buttonBg rounded w-2/3"></div>
        <div className="h-3 bg-gray-200 dark:bg-dark-buttonBg rounded w-1/2"></div>
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 w-3 bg-gray-200 dark:bg-dark-buttonBg rounded"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const EventSkeleton = () => (
  <div className="p-4 animate-pulse">
    <div className="flex items-center space-x-3">
      <div className="rounded-lg bg-gray-200 dark:bg-dark-buttonBg h-10 w-10"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-dark-buttonBg rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-dark-buttonBg rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 dark:bg-dark-buttonBg rounded w-1/3"></div>
      </div>
    </div>
  </div>
);

export default DashboardPage;