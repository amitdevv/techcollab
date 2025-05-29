import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  MapPin,
  Filter,
  Clock,
  Users,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card"; // Added CardHeader, CardTitle
import Badge from "../../components/ui/Badge";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  getEvents,
  deleteEvent,
  Event,
  EventFilters,
  eventCategories,
  locationTypes,
} from "../../services/eventApi";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import CustomSelect from '../../components/ui/CustomSelect';

const eventTypes = [{ value: "all", label: "All Events" }, ...eventCategories];

const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const filters: EventFilters = {
        page: currentPage,
        limit: 12,
        search: searchQuery || undefined,
        category: selectedType !== "all" ? (selectedType as any) : undefined,
        location: selectedLocation !== "all" ? {
          type: selectedLocation as any
        } : undefined,
        sort: "date",
      };

      // Price filters using priceRange
      if (selectedPrice === "free") {
        filters.priceRange = { min: 0, max: 0 };
      } else if (selectedPrice === "paid") {
        filters.priceRange = { min: 0.01, max: 99999 };
      }

      const response = await getEvents(filters);
      setEvents(response.data.events);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [
    currentPage,
    selectedType,
    selectedLocation,
    selectedPrice,
    selectedDateFilter,
  ]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchEvents();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedLocation("all");
    setSelectedPrice("all");
    setSelectedDateFilter("all");
    setCurrentPage(1);
  };

  const getEventTypeVariant = (category: string) => {
    switch (category) {
      case "conference":
        return "success";
      default:
        return "outline";
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!user) {
      toast.error("Please log in to delete events");
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      try {
        await deleteEvent(eventId);
        toast.success("Event deleted successfully");
        // Refresh the events list
        fetchEvents();
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error("Failed to delete event");
      }
    }
  };

  // Check if user can edit/delete event
  const canEditEvent = (event: Event) => {
    return user && (user._id === event.organizer._id || user.id === event.organizer._id);
  };

  return (
    <div className="min-h-screen relative overflow-visible bg-gray-50 dark:bg-[#232323] rounded-xl">
      <div className="relative z-10 p-6 space-y-8 animate-fade-in max-w-7xl mx-auto">
        {/* Enhanced Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-green-600/10 to-emerald-600/10 dark:from-[#219653]/10 dark:via-[#404040]/10 dark:to-[#171717]/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/80 dark:bg-[#232323] backdrop-blur-md rounded-2xl p-8 shadow-xl border border-emerald-100/50 dark:border-[#404040]">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 dark:bg-[#219653] rounded-xl shadow-lg">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 dark:from-[#219653] dark:via-[#219653] dark:to-[#219653] bg-clip-text text-transparent">
                      Tech Events
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="h-4 w-4 text-emerald-600 dark:text-[#219653]" />
                      <span className="text-emerald-600 dark:text-[#219653] text-sm font-medium">Connect & Learn</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed">
                  Discover and join upcoming events in the tech community
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/events/create">
                  <Button
                    variant="default"
                    leftIcon={<Calendar className="h-5 w-5" />}
                    className="px-8 py-3 text-base font-semibold shadow-xl bg-[#219653] hover:bg-[#1e8747] text-white border-0 transition-all duration-300"
                  >
                    Create Event
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Enhanced Filters Sidebar */}
          <div className="lg:w-80 space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white/90 to-emerald-50/80 dark:from-[#232323] dark:to-[#171717] dark:border-[#404040] backdrop-blur-md rounded-2xl overflow-hidden">
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
                    <Calendar className="h-4 w-4 text-emerald-600 dark:text-[#219653]" />
                    Event Type
                  </label>
                  <CustomSelect
                    options={eventTypes}
                    value={selectedType}
                    onChange={setSelectedType}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600 dark:text-[#219653]" />
                    Location
                  </label>
                  <CustomSelect
                    options={[
                      { value: "all", label: "All Locations" },
                      ...locationTypes,
                    ]}
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-600 dark:text-[#219653]" />
                    Date Range
                  </label>
                  <CustomSelect
                    options={[
                      { value: "all", label: "Any Date" },
                      { value: "today", label: "Today" },
                      { value: "thisWeek", label: "This Week" },
                      { value: "thisMonth", label: "This Month" },
                      { value: "upcoming", label: "Upcoming" },
                    ]}
                    value={selectedDateFilter}
                    onChange={setSelectedDateFilter}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600 dark:text-[#219653]" />
                    Price
                  </label>
                  <CustomSelect
                    options={[
                      { value: "all", label: "All Prices" },
                      { value: "free", label: "Free" },
                      { value: "paid", label: "Paid" },
                    ]}
                    value={selectedPrice}
                    onChange={setSelectedPrice}
                  />
                </div>
                <Button
                  variant="outline"
                  leftIcon={<Filter className="h-4 w-4" />}
                  className="w-full border-[#404040] dark:bg-[#404040] dark:text-white hover:bg-[#333] dark:hover:bg-[#333] shadow-md backdrop-blur-sm rounded-xl py-3"
                  onClick={handleClearFilters}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-md">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-lg">Popular Tags</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {["React","JavaScript","Python","Cloud","AI","Data Science","DevOps"].map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-[#219653] dark:text-[#219653] dark:bg-[#232323] dark:hover:bg-[#1e8747]/30 rounded-xl px-3 py-1.5 shadow-sm transition-colors duration-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-md">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex-1">
                    <Input
                      placeholder="Search for events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftIcon={<Search className="h-4 w-4" />}
                      className="w-full border-green-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {events.length} events found
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {events.map((event) => (
                      <Card
                        key={event._id}
                        className="flex h-full flex-col overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-md"
                      >
                        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                          <img
                            src={
                              event.images[0]?.url ||
                              `https://picsum.photos/seed/${event._id}/800/450`
                            }
                            alt={event.title}
                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                          <div className="absolute left-0 top-0 m-2">
                            <Badge
                              variant={getEventTypeVariant(event.category)}
                              className="backdrop-blur-sm bg-gradient-to-r from-emerald-100 to-green-100 dark:from-[#232323] dark:to-[#171717] border border-emerald-200/50 dark:border-[#219653]/40 shadow-sm rounded-xl text-emerald-700 dark:text-[#219653] px-3 py-1 text-xs font-semibold tracking-wide"
                            >
                              {event.category.charAt(0).toUpperCase() +
                                event.category.slice(1)}
                            </Badge>
                          </div>
                          {event.price === 0 && (
                            <div className="absolute right-0 top-0 m-2">
                              <Badge
                                variant="success"
                                className="backdrop-blur-sm bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 shadow-md rounded-xl px-3 py-1 text-xs font-semibold tracking-wide"
                              >
                                Free
                              </Badge>
                            </div>
                          )}
                          {event.featured && (
                            <div className="absolute right-0 bottom-0 m-2">
                              <Badge
                                variant="success"
                                className="backdrop-blur-sm bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 shadow-md rounded-xl px-3 py-1 text-xs font-semibold tracking-wide"
                              >
                                Featured
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardContent className="flex flex-1 flex-col p-4">
                          <div className="mb-2 flex items-center text-xs text-emerald-700 dark:text-[#219653] font-medium">
                            <Calendar className="mr-1 h-3.5 w-3.5 text-emerald-500 dark:text-[#219653]" />
                            <span>{format(new Date(event.date), "MMM dd, yyyy")}{event.endDate && !new Date(event.date).toDateString().includes(new Date(event.endDate).toDateString()) && ` - ${format(new Date(event.endDate), "MMM dd, yyyy")}`}</span>
                          </div>

                          <h3 className="line-clamp-2 text-lg font-medium text-gray-900">
                            {event.title}
                          </h3>

                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <Clock className="mr-1 h-3.5 w-3.5" />
                            <span>
                              {event.time}
                              {event.endTime && ` - ${event.endTime}`}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <MapPin className="mr-1 h-3.5 w-3.5" />
                            <span>
                              {event.location.type === "online"
                                ? "Online"
                                : event.location.type === "hybrid"
                                ? `${
                                    event.location.city ||
                                    event.location.venue ||
                                    "Hybrid"
                                  }`
                                : `${
                                    event.location.city ||
                                    event.location.venue ||
                                    "In-Person"
                                  }`}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <Users className="mr-1 h-3.5 w-3.5" />
                            <span>
                              {event.attendeeCount} attendees
                              {event.maxAttendees &&
                                ` / ${event.maxAttendees} max`}
                              {event.isFull && (
                                <span className="ml-1 text-red-500">(Full)</span>
                              )}
                            </span>
                          </div>

                          <div className="mt-1 text-xs text-gray-500">
                            <span>by {event.organizer.name}</span>
                            {event.organizer.verified && (
                              <span className="ml-1 text-green-500">✓</span>
                            )}
                          </div>

                          <p className="mt-3 flex-1 text-sm text-gray-600 line-clamp-2">
                            {event.description}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-1">
                            {event.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" size="sm" className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-[#219653] dark:text-[#219653] dark:bg-[#232323] rounded-xl px-2 py-0.5">
                                {tag}
                              </Badge>
                            ))}
                            {event.tags.length > 3 && (
                              <Badge variant="outline" size="sm" className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-[#219653] dark:text-[#219653] dark:bg-[#232323] rounded-xl px-2 py-0.5">
                                +{event.tags.length - 3}
                              </Badge>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm font-medium">
                              {event.price > 0 ? (
                                <span className="text-gray-900">
                                  ${event.price} {event.currency}
                                </span>
                              ) : (
                                <span className="text-green-600 font-semibold">Free</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {canEditEvent(event) && (
                                <>
                                  <Link to={`/events/edit/${event._id}`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 p-2"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 p-2"
                                    onClick={() => handleDeleteEvent(event._id, event.title)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Link to={`/events/${event._id}`}>
                                <Button
                                  size="sm"
                                  variant={event.isFull ? "outline" : "default"}
                                  disabled={event.isFull}
                                  className={
                                    !event.isFull 
                                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm px-4 font-medium" 
                                      : "border-gray-200 text-gray-500"
                                  }
                                >
                                  {event.isFull ? "Full" : "View Details"}
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </Button>

                        <div className="flex items-center space-x-2">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(
                              (page) =>
                                page === 1 ||
                                page === totalPages ||
                                Math.abs(page - currentPage) <= 1
                            )
                            .map((page, index, array) => (
                              <React.Fragment key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <span className="text-gray-400">...</span>
                                )}
                                <Button
                                  variant={
                                    currentPage === page ? "default" : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className={
                                    currentPage === page
                                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm"
                                      : "border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
                                  }
                                >
                                  {page}
                                </Button>
                              </React.Fragment>
                            ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}

                  {events.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <Calendar className="mx-auto h-12 w-12 text-emerald-400 dark:text-[#219653]" />
                      <h3 className="mt-2 text-lg font-semibold text-emerald-700 dark:text-[#219653]">No events found</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search criteria or create a new event.</p>
                      <div className="mt-6">
                        <Link to="/events/create">
                          <Button
                            variant="default"
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg px-6 py-2.5 font-semibold"
                          >
                            Create Event
                          </Button>
                        </Link>
                      </div>
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

export default EventsPage;
