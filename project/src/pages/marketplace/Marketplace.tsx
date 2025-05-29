import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Briefcase,
  Star,
  TrendingUp,
  Sparkles,
  Award,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  ShoppingBag,
  Zap,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { formatCurrency } from "../../lib/utils";
import { Link } from "react-router-dom";
import { gigApi, Gig, GigFilters } from "../../services/gigApi";
import { useAuth } from "../../contexts/AuthContext";
import CustomSelect from '../../components/ui/CustomSelect';
import AISearchBox from '../../components/marketplace/AISearchBox';

const categories = [
  { value: "all", label: "All Categories" },
  { value: "web", label: "Web Development" },
  { value: "mobile", label: "Mobile Development" },
  { value: "design", label: "UI/UX Design" },
  { value: "data", label: "Data Science" },
  { value: "devops", label: "DevOps" },
  { value: "writing", label: "Writing & Translation" },
  { value: "marketing", label: "Digital Marketing" },
];

const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalGigs: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Fetch gigs from API
  const fetchGigs = async (filters: GigFilters = {}) => {
    try {
      setLoading(true);
      const response = await gigApi.getGigs({
        page: 1,
        limit: 12,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        priceRange: priceRange !== "all" ? priceRange : undefined,
        sortBy,
        search: searchQuery || undefined,
        ...filters,
      });

      setGigs(response.gigs);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching gigs:", error);
      toast.error("Failed to load gigs");
    } finally {
      setLoading(false);
    }
  };

  // Handle AI search filters
  const handleAISearch = (aiFilters: any) => {
    // Apply AI-suggested filters
    if (aiFilters.category) {
      setSelectedCategory(aiFilters.category);
    }
    if (aiFilters.priceRange) {
      setPriceRange(aiFilters.priceRange);
    }
    if (aiFilters.sortBy) {
      setSortBy(aiFilters.sortBy);
    }
    
    // The search query is already updated by the AI component
    fetchGigs(aiFilters);
  };

  // Initial load
  useEffect(() => {
    fetchGigs();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchGigs();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, priceRange, sortBy, searchQuery]);

  const handleLoadMore = async () => {
    if (!pagination.hasNext) return;

    try {
      const response = await gigApi.getGigs({
        page: pagination.currentPage + 1,
        limit: 12,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        priceRange: priceRange !== "all" ? priceRange : undefined,
        sortBy,
        search: searchQuery || undefined,
      });

      setGigs((prev) => [...prev, ...response.gigs]);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error loading more gigs:", error);
      toast.error("Failed to load more gigs");
    }
  };

  // Handle delete gig
  const handleDeleteGig = async (gigId: string, gigTitle: string) => {
    if (!user) {
      toast.error("Please log in to delete gigs");
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${gigTitle}"? This action cannot be undone.`)) {
      try {
        await gigApi.deleteGig(gigId);
        toast.success("Gig deleted successfully");
        // Refresh the gigs list
        fetchGigs();
      } catch (error) {
        console.error("Error deleting gig:", error);
        toast.error("Failed to delete gig");
      }
    }
  };

  // Check if user can edit/delete gig
  const canEditGig = (gig: Gig) => {
    return user && (user._id === gig.freelancer?._id || user.id === gig.freelancer?._id);
  };

  return (
    <div className="min-h-screen relative overflow-visible bg-gray-50 dark:bg-[#232323] rounded-xl">
      {/* Animated Background Elements */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-green-600/20 dark:from-[#219653]/10 dark:to-[#404040]/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-gray-400/10 to-slate-600/10 dark:from-[#404040]/10 dark:to-[#171717]/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-emerald-600/10 dark:from-[#219653]/10 dark:to-[#404040]/10 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div> */}

      <div className="relative z-10 p-6 space-y-8 animate-fade-in max-w-7xl mx-auto">
        {/* Enhanced Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-green-600/10 to-emerald-600/10 dark:from-[#219653]/10 dark:via-[#404040]/10 dark:to-[#171717]/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/80 dark:bg-[#232323] backdrop-blur-md rounded-2xl p-8 shadow-xl border border-emerald-100/50 dark:border-[#404040]">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 dark:bg-[#219653] rounded-xl shadow-lg">
                    <ShoppingBag className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 dark:from-[#219653] dark:via-[#219653] dark:to-[#219653] bg-clip-text text-transparent">
                      Marketplace
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">Premium Talent Hub</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed">
                  Discover exceptional freelance talent and transform your projects with expert professionals
                </p>
                <div className="flex items-center gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600 dark:text-[#219653]" />
                    <span>10K+ Professionals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-600 dark:text-[#219653]" />
                    <span>Top Rated Services</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-600 dark:text-[#219653]" />
                    <span>Fast Delivery</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/marketplace/create">
                  <Button
                    variant="default"
                    leftIcon={<Briefcase className="h-5 w-5" />}
                    className="px-8 py-3 text-base font-semibold shadow-xl bg-[#219653] hover:bg-[#1e8747] text-white border-0 transition-all duration-300"
                  >
                    Create Gig
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  leftIcon={<TrendingUp className="h-5 w-5" />}
                  className="px-6 py-3 text-base font-medium border-[#404040] dark:bg-[#404040] dark:text-white hover:bg-[#333] dark:hover:bg-[#333]"
                >
                  Browse Trends
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Enhanced Filters Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Main Filters Card */}
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-[#232323] dark:border-[#404040] backdrop-blur-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 dark:bg-[#232323] border-b border-emerald-100/50 dark:border-[#404040]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 dark:bg-[#219653] rounded-lg">
                    <Filter className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Smart Filters</h3>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-emerald-600 dark:text-[#219653]" />
                    Category
                  </label>
                  <CustomSelect
                    options={categories}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Star className="h-4 w-4 text-emerald-600 dark:text-[#219653]" />
                    Price Range
                  </label>
                  <CustomSelect
                    options={[
                      { value: "all", label: "All Prices" },
                      { value: "low", label: "Under $300" },
                      { value: "medium", label: "$300 - $700" },
                      { value: "high", label: "Over $700" },
                    ]}
                    value={priceRange}
                    onChange={setPriceRange}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-[#219653]" />
                    Sort By
                  </label>
                  <CustomSelect
                    options={[
                      { value: "relevance", label: "Relevance" },
                      { value: "price-low", label: "Price: Low to High" },
                      { value: "price-high", label: "Price: High to Low" },
                      { value: "rating", label: "Highest Rated" },
                    ]}
                    value={sortBy}
                    onChange={setSortBy}
                  />
                </div>

                <Button
                  variant="outline"
                  leftIcon={<Filter className="h-4 w-4" />}
                  className="w-full border-[#404040] dark:bg-[#404040] dark:text-white hover:bg-[#333] dark:hover:bg-[#333] shadow-md backdrop-blur-sm rounded-xl py-3"
                  onClick={() => {
                    setSelectedCategory("all");
                    setPriceRange("all");
                    setSortBy("relevance");
                    setSearchQuery("");
                  }}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>

            {/* Popular Tags Card */}
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-[#232323] dark:border-[#404040] backdrop-blur-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:bg-[#232323] border-b border-green-100/50 dark:border-[#404040]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 dark:bg-[#219653] rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Trending Skills</h3>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-3">
                  {[
                    "React", "JavaScript", "UI/UX", "Node.js", 
                    "Python", "AWS", "Mobile", "AI/ML"
                  ].map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-[#404040] dark:border-[#404040] dark:bg-[#232323] dark:text-white cursor-pointer transform hover:scale-105 rounded-xl px-3 py-1.5"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:bg-[#232323] dark:border-[#404040] backdrop-blur-md rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 dark:bg-[#219653] rounded-xl w-fit mx-auto">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Quality Guaranteed</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">95% client satisfaction rate</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="font-bold text-lg text-emerald-600 dark:text-[#219653]">24/7</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Support</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-emerald-600 dark:text-[#219653]">100%</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Secure</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Main Content */}
          <div className="flex-1 space-y-6">
            {/* Search and View Controls */}
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-[#232323] dark:border-[#404040] backdrop-blur-md rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <AISearchBox
                      value={searchQuery}
                      onQueryChange={setSearchQuery}
                      onSearch={handleAISearch}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="relative">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-emerald-200 dark:border-[#404040] border-t-emerald-600 dark:border-t-[#219653]" />
                    <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-emerald-400 dark:border-[#219653] opacity-20" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Results Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <p className="text-gray-700 dark:text-gray-200 font-medium">
                        <span className="text-emerald-600 dark:text-[#219653] font-bold">{pagination.totalGigs}</span> gigs found
                      </p>
                      {searchQuery && (
                        <Badge className="bg-emerald-100 dark:bg-[#232323] text-emerald-700 dark:text-[#219653] border-emerald-200 dark:border-[#404040]">
                          Results for "{searchQuery}"
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {gigs.length} of {pagination.totalGigs}
                    </div>
                  </div>

                  {gigs.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="relative mx-auto w-fit mb-6">
                        <div className="p-6 bg-gradient-to-br from-emerald-100 to-green-100 dark:bg-[#232323] rounded-full">
                          <Briefcase className="h-16 w-16 text-emerald-500 dark:text-[#219653]" />
                        </div>
                        <div className="absolute -top-2 -right-2 p-2 bg-amber-400 rounded-full">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No gigs found</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting your filters or search terms</p>
                      <Button
                        variant="outline"
                        leftIcon={<Filter className="h-4 w-4" />}
                        className="w-full border-[#404040] dark:bg-[#404040] dark:text-white hover:bg-[#333] dark:hover:bg-[#333]"
                        onClick={() => {
                          setSelectedCategory("all");
                          setPriceRange("all");
                          setSortBy("relevance");
                          setSearchQuery("");
                        }}
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {gigs.map((gig, index) => (
                        <div
                          key={gig._id || gig.id}
                          className="group animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <Card className="border-0 shadow-lg bg-white/95 dark:bg-[#232323] dark:border-[#404040] backdrop-blur-sm rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-6 space-y-4">
                              {/* Header with badges and price */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <Badge 
                                    variant="outline" 
                                    className="border-emerald-200 dark:border-[#404040] bg-emerald-100 dark:bg-[#232323] text-emerald-700 dark:text-[#219653] capitalize rounded-md"
                                  >
                                    {gig.category}
                                  </Badge>
                                  {index < 2 && (
                                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 rounded-md">
                                      <Award className="h-3 w-3 mr-1" />
                                      Top Rated
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-emerald-600 dark:text-[#219653]">
                                    {formatCurrency(gig.price)}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Starting at</div>
                                </div>
                              </div>

                              {/* Title */}
                              <h3 className="font-bold text-xl text-gray-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-[#219653] transition-colors">
                                {gig.title}
                              </h3>

                              {/* Description */}
                              <p className="text-gray-600 dark:text-gray-300 line-clamp-2 text-base leading-relaxed">
                                {gig.description}
                              </p>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-2">
                                {gig.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    size="sm"
                                    className="border-emerald-200/50 dark:border-[#404040] bg-emerald-50/50 dark:bg-[#232323] text-emerald-700 dark:text-[#219653]"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>

                              {/* Stats and CTA */}
                              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#404040]">
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                    <span className="font-medium">{gig.rating.toFixed(1)}</span>
                                    <span>({gig.reviews} reviews)</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{gig.deliveryTime || "7 days"}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{gig.orders || 0} orders</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {canEditGig(gig) && (
                                    <>
                                      <Link to={`/marketplace/${gig._id || gig.id}/edit`}>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-emerald-700 dark:text-[#219653] hover:bg-emerald-50 dark:hover:bg-[#232323] p-2 border-[#404040]"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </Link>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:bg-red-50 dark:hover:bg-[#232323] p-2 border-[#404040]"
                                        onClick={() => {
                                          const gigId = gig._id || gig.id;
                                          if (gigId) {
                                            handleDeleteGig(gigId, gig.title);
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  <Link to={`/marketplace/${gig._id || gig.id}`}>
                                    <Button
                                      size="sm"
                                      className="bg-gradient-to-r from-emerald-500 to-green-600 dark:from-[#219653] dark:to-[#219653] hover:from-emerald-600 hover:to-green-700 dark:hover:from-[#219653]/90 dark:hover:to-[#219653]/90 text-white border-0 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 px-4 py-2"
                                    >
                                      View Details
                                      <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Load More Button */}
                  {pagination.hasNext && (
                    <div className="text-center pt-8">
                      <Button 
                        variant="outline" 
                        onClick={handleLoadMore}
                        className="px-8 py-3 text-base border-[#404040] dark:bg-[#404040] dark:text-white hover:bg-[#333] dark:hover:bg-[#333] backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                      >
                        Load More Gigs
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage; 