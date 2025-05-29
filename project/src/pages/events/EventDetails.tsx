import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Tag,
  ArrowLeft,
  Share2,
  Heart,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import Button from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import { format } from "date-fns";
import {
  getEvent,
  rsvpEvent,
  cancelRsvp,
  deleteEvent,
  Event,
} from "../../services/eventApi";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvent(id);
    }
  }, [id]);

  const loadEvent = async (eventId: string) => {
    try {
      setLoading(true);
      const response = await getEvent(eventId);
      setEvent(response.data);

      // Check if current user is registered
      if (user && response.data.attendees) {
        setIsRegistered(
          response.data.attendees.some(
            (attendee: any) => attendee._id === user.id
          )
        );
      }
    } catch (error) {
      console.error("Error loading event:", error);
      toast.error("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async () => {
    if (!user) {
      toast.error("Please log in to register for events");
      return;
    }

    if (!id) return;

    try {
      setRsvpLoading(true);

      if (isRegistered) {
        await cancelRsvp(id);
        toast.success("Registration cancelled successfully");
        setIsRegistered(false);
      } else {
        await rsvpEvent(id);
        toast.success("Successfully registered for event");
        setIsRegistered(true);
      }

      // Reload event to get updated attendee count
      loadEvent(id);
    } catch (error: any) {
      console.error("Error with RSVP:", error);
      toast.error(
        error.response?.data?.message || "Failed to update registration"
      );
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!id || !event) return;

    if (
      window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      try {
        await deleteEvent(id);
        toast.success("Event deleted successfully");
        navigate("/events");
      } catch (error: any) {
        console.error("Error deleting event:", error);
        toast.error(error.response?.data?.message || "Failed to delete event");
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Event link copied to clipboard");
    }
  };

  const getEventTypeVariant = (category: string) => {
    switch (category) {
      case "conference":
        return "primary";
      case "workshop":
        return "secondary";
      case "hackathon":
        return "accent";
      case "webinar":
        return "success";
      default:
        return "outline";
    }
  };

  const getLocationDisplay = () => {
    if (!event) return "";

    const { location } = event;
    if (location.type === "online") {
      return "Online Event";
    } else if (location.type === "hybrid") {
      return `${location.city || location.venue || "Hybrid Event"}`;
    } else {
      return (
        [location.venue, location.city, location.country]
          .filter(Boolean)
          .join(", ") || "In-Person Event"
      );
    }
  };

  const isOwner = user && event && event.organizer._id === user.id;
  const canRegister =
    event && !event.isFull && event.status === "published" && !isOwner;
  const isEventPast = event && new Date(event.date) < new Date();
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 bg-[#fafafa] dark:bg-[#232323] min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-dark-button" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex justify-center items-center py-12 bg-[#fafafa] dark:bg-[#232323] min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Event not found</p>
          <Link to="/events">
            <Button className="mt-4">Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 bg-[#fafafa] dark:bg-[#232323] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/events"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-dark-text"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Events
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Event Info */}
          <Card className="dark:bg-[#171717] dark:border-dark-buttonBg">
            <CardContent className="p-8">
              <div className="flex justify-between items-start gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">
                    {event.title}
                  </h1>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      {format(new Date(event.date), "EEEE, MMMM dd, yyyy")}
                      {event.endDate &&
                        !new Date(event.date)
                          .toDateString()
                          .includes(new Date(event.endDate).toDateString()) &&
                        ` - ${format(
                          new Date(event.endDate),
                          "MMMM dd, yyyy"
                        )}`}
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      {event.time}
                      {event.endTime && ` - ${event.endTime}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4" />
                      {getLocationDisplay()}
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      {event.attendeeCount} attending
                      {event.maxAttendees && ` / ${event.maxAttendees} max`}
                    </div>
                  </div>

                  {event.price > 0 && (
                    <div className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                      <DollarSign className="mr-1 h-5 w-5" />
                      {event.price} {event.currency}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {" "}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="hover:bg-green-50 border-green-300 hover:border-green-400"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  {isOwner && (
                    <>
                      <Link to={`/events/${event._id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-green-50 border-green-300 hover:border-green-400"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>{" "}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteEvent}
                        className="hover:bg-red-50 border-red-300 hover:border-red-400"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Description */}
          <Card className="dark:bg-[#171717] dark:border-dark-buttonBg">
            <CardHeader>
              <CardTitle>About This Event</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap dark:text-gray-300">
                {event.description}
              </p>
            </CardContent>
          </Card>
          {/* Agenda */}
          {event.agenda && event.agenda.length > 0 && (
            <Card className="dark:bg-[#171717] dark:border-dark-buttonBg">
              <CardHeader>
                <CardTitle>Event Agenda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {" "}
                  {event.agenda.map((item, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-green-500 pl-4"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                        <Clock className="h-4 w-4" />
                        {item.time}
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-dark-text mt-1">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-gray-600 dark:text-gray-300 mt-1">{item.description}</p>
                      )}{" "}
                      {item.speaker && (
                        <p className="text-green-600 dark:text-dark-text mt-1">
                          Speaker: {item.speaker}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {/* Requirements */}
          {event.requirements && event.requirements.length > 0 && (
            <Card className="dark:bg-[#171717] dark:border-dark-buttonBg">
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {event.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="dark:text-dark-text">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {/* Tags */}
          {event.tags.length > 0 && (
            <Card className="dark:bg-[#171717] dark:border-dark-buttonBg">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium dark:text-dark-text">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Card */}
          <Card className="dark:bg-[#171717] dark:border-dark-buttonBg">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                {" "}
                {isOwner ? (
                  <div className="text-center p-4 bg-green-50 rounded-md">
                    <p className="text-green-700 font-medium">
                      You are the organizer
                    </p>
                  </div>
                ) : canRegister ? (
                  <Button
                    onClick={handleRSVP}
                    disabled={rsvpLoading}
                    fullWidth
                    size="md"
                    variant={isRegistered ? "outline" : "default"}
                  >
                    {rsvpLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : isRegistered ? (
                      <XCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {isRegistered
                      ? "Cancel Registration"
                      : "Register for Event"}
                  </Button>
                ) : event.isFull ? (
                  <div className="text-center p-4 bg-red-50 rounded-md shadow-sm">
                    <p className="text-red-700 font-medium">Event is Full</p>
                  </div>
                ) : isEventPast ? (
                  <div className="text-center p-4 bg-gray-50 rounded-md shadow-sm">
                    <p className="text-gray-700 font-medium">Event has ended</p>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-md shadow-sm">
                    <p className="text-gray-700">Please log in to register</p>
                  </div>
                )}{" "}
                {isRegistered && (
                  <div className="text-center p-3 bg-green-50 rounded-md shadow-sm">
                    <p className="text-green-700 text-sm">
                      ✓ You're registered for this event
                    </p>
                  </div>
                )}
                {event.rsvpDeadline && (
                  <div className="text-sm text-gray-600">
                    <p>
                      RSVP by{" "}
                      {format(new Date(event.rsvpDeadline), "MMMM dd, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Organizer Card */}
          <Card className="dark:bg-[#171717] dark:border-dark-buttonBg">
            <CardHeader>
              <CardTitle>Organizer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar
                  src={event.organizer.profilePicture}
                  alt={event.organizer.name}
                  size="md"
                />
                <div>
                  <h4 className="font-medium dark:text-dark-text">{event.organizer.name}</h4>
                  {event.organizer.verified && (
                    <p className="text-sm text-blue-600">
                      ✓ Verified Organizer
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          {(event.location.type === "offline" ||
            event.location.type === "hybrid") &&
            event.location.address && (
              <Card className="dark:bg-[#171717] dark:border-dark-buttonBg">
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {event.location.venue && (
                      <p className="font-medium dark:text-dark-text">{event.location.venue}</p>
                    )}
                    <p className="text-gray-600 dark:text-gray-300">{event.location.address}</p>
                    <p className="text-gray-600 dark:text-gray-300">
                      {[event.location.city, event.location.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Meeting Link for Online Events */}
          {(event.location.type === "online" ||
            event.location.type === "hybrid") &&
            event.location.meetingLink &&
            isRegistered && (
              <Card className="dark:bg-[#171717] dark:border-dark-buttonBg">
                <CardHeader>
                  <CardTitle>Meeting Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">
                    Join the event online:
                  </p>
                  <a
                    href={event.location.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all dark:text-dark-text"
                  >
                    {event.location.meetingLink}
                  </a>
                </CardContent>
              </Card>
            )}

          {/* Attendees Preview */}
          {event.attendees.length > 0 && (
            <Card className="dark:bg-[#171717] dark:border-dark-buttonBg">
              <CardHeader>
                <CardTitle>Attendees ({event.attendeeCount})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex -space-x-2">
                  {event.attendees.slice(0, 8).map((attendee) => (
                    <Avatar
                      key={attendee._id}
                      src={attendee.profilePicture}
                      alt={attendee.name}
                      size="sm"
                      className="border-2 border-white"
                    />
                  ))}
                  {event.attendees.length > 8 && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 border-2 border-white text-xs font-medium text-gray-600">
                      +{event.attendees.length - 8}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
