import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  Plus,
  X,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import CustomSelect from "../../components/ui/CustomSelect";
import Textarea from "../../components/ui/Textarea";
import { ImageUpload, ImagePreview } from "../../components/ui/ImageUpload";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import {
  createEvent,
  updateEvent,
  getEvent,
  eventCategories,
  locationTypes,
} from "../../services/eventApi";
import { useDrafts } from "../../hooks/useDrafts";

interface UploadedImage {
  url: string;
  publicId: string;
}

interface AgendaItem {
  time: string;
  title: string;
  description?: string;
  speaker?: string;
}

const EventFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = Boolean(id);
  
  // Draft-related state from location
  const { draftData, draftId, isEditingDraft } = location.state || {};
  
  const { saveDraft, updateDraft, deleteDraft, isSaving } = useDrafts();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [requirementInput, setRequirementInput] = useState("");
  const [agendaItem, setAgendaItem] = useState<AgendaItem>({
    time: "",
    title: "",
    description: "",
    speaker: "",
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    date: "",
    endDate: "",
    time: "",
    endTime: "",
    locationType: "online" as "online" | "offline" | "hybrid",
    venue: "",
    address: "",
    city: "",
    country: "",
    meetingLink: "",
    price: "0",
    currency: "USD",
    maxAttendees: "",
    rsvpDeadline: "",
    requirements: [] as string[],
    agenda: [] as AgendaItem[],
    featured: false,
    status: "draft" as "draft" | "published" | "cancelled" | "completed",
  });

  // Load event data if editing or draft data if editing draft
  useEffect(() => {
    if (isEditing && id) {
      loadEventData(id);
    } else if (isEditingDraft && draftData) {
      loadDraftData(draftData);
    }
  }, [isEditing, id, isEditingDraft, draftData]);

  const loadDraftData = (draft: any) => {
    setFormData({
      title: draft.title || "",
      description: draft.description || "",
      category: draft.category || "",
      locationType: draft.locationType || "online",
      venue: draft.venue || "",
      address: draft.address || "",
      city: draft.city || "",
      country: draft.country || "",
      meetingLink: draft.meetingLink || "",
      date: draft.date || "",
      time: draft.time || "",
      endDate: draft.endDate || "",
      endTime: draft.endTime || "",
      price: draft.price || "0",
      currency: draft.currency || "USD",
      maxAttendees: draft.maxAttendees || "",
      rsvpDeadline: draft.rsvpDeadline || "",
      requirements: draft.requirements || [],
      agenda: draft.agenda || [],
      featured: draft.featured || false,
      status: draft.status || "draft",
    });

    if (draft.images) {
      setUploadedImages(draft.images);
    }
    if (draft.tags) {
      setTags(draft.tags);
    }
  };

  const loadEventData = async (eventId: string) => {
    try {
      setLoading(true);
      const response = await getEvent(eventId);
      const event = response.data;

      setFormData({
        title: event.title,
        description: event.description,
        category: event.category,
        locationType: event.location.type,
        venue: event.location.venue || "",
        address: event.location.address || "",
        city: event.location.city || "",
        country: event.location.country || "",
        meetingLink: event.location.meetingLink || "",
        date: event.date.split("T")[0],
        time: event.time,
        endDate: event.endDate ? event.endDate.split("T")[0] : "",
        endTime: event.endTime || "",
        price: event.price.toString(),
        currency: event.currency,
        maxAttendees: event.maxAttendees?.toString() || "",
        rsvpDeadline: event.rsvpDeadline
          ? event.rsvpDeadline.split("T")[0]
          : "",
        requirements: event.requirements || [],
        agenda: event.agenda || [],
      });

      setUploadedImages(
        event.images.map((img: any) => ({
          url: img.url,
          publicId: img.publicId,
        }))
      );
    } catch (error) {
      console.error("Error loading event:", error);
      toast.error("Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      locationType: value,
      venue: "",
      address: "",
      city: "",
      country: "",
      meetingLink: "",
    }));
  };

  const handleImageUploaded = (imageUrl: string, publicId: string) => {
    // Only allow 1 image for events, replace if exists
    setUploadedImages([{ url: imageUrl, publicId }]);
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      if (!tags.includes(tagInput.trim()) && tags.length < 10) {
        setTags((prev) => [...prev, tagInput.trim()]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleRequirementAdd = () => {
    if (requirementInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()],
      }));
      setRequirementInput("");
    }
  };

  const removeRequirement = (requirement: string) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((req) => req !== requirement),
    }));
  };

  const handleAgendaAdd = () => {
    if (agendaItem.time && agendaItem.title) {
      setFormData((prev) => ({
        ...prev,
        agenda: [...prev.agenda, { ...agendaItem }],
      }));
      setAgendaItem({ time: "", title: "", description: "", speaker: "" });
    }
  };

  const removeAgendaItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index),
    }));
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title to save as draft');
      return;
    }

    const draftPayload = {
      ...formData,
      images: uploadedImages,
      tags,
    };

    try {
      if (isEditingDraft && draftId) {
        await updateDraft(draftId, formData.title, draftPayload);
      } else {
        await saveDraft({
          type: 'event',
          title: formData.title,
          data: draftPayload
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    
    if (isDraft) {
      await handleSaveDraft();
      return;
    }

    setSubmitting(true);

    try {
      const eventData = {
        ...formData,
        maxAttendees: formData.maxAttendees
          ? parseInt(formData.maxAttendees)
          : undefined,
        price: parseFloat(formData.price),
        endDate: formData.endDate || undefined,
        rsvpDeadline: formData.rsvpDeadline || undefined,
        location: {
          type: formData.locationType,
          venue: formData.venue || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          country: formData.country || undefined,
          meetingLink: formData.meetingLink || undefined,
        },
        images: uploadedImages,
        tags,
        status: 'published', // When submitting normally, mark as published
      };

      console.log('Event data being sent to API:', JSON.stringify(eventData, null, 2));

      if (isEditing) {
        await updateEvent(id!, eventData);
        toast.success("Event updated successfully!");
      } else {
        await createEvent(eventData);
        toast.success("Event created successfully!");
        
        // If we were editing a draft, delete it after successful creation
        if (isEditingDraft && draftId) {
          await deleteDraft(draftId, false);
        }
      }
      navigate("/events");
    } catch (error) {
      console.error('Event submission error:', error);
      toast.error(
        error instanceof Error ? error.message : "Error saving event"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center py-12">
  //       <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
  //     </div>
  //   );
  // }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in bg-[#fafafa] dark:bg-[#232323] min-h-screen">
      <div className="mb-6 pt-6 px-6">
        <Link
          to="/events"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-dark-text"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Events
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-dark-text">
          {isEditing ? "Edit Event" : "Create an Event"}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          Share an event with the tech community. Provide all details to help
          attendees.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6">
        <Card className="dark:bg-[#171717] dark:border-dark-buttonBg">
          <CardHeader>
            <CardTitle className="dark:text-dark-text">Event Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Event Title *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="React Conference 2025"
                maxLength={100}
                required
              />

              <Textarea
                label="Description *"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a detailed description of your event. What will attendees learn or experience? Who should attend?"
                rows={6}
                required
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CustomSelect
                  label="Event Category *"
                  name="category"
                  value={formData.category}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                  options={[
                    { value: "", label: "Select event category" },
                    ...eventCategories,
                  ]}
                />

                <CustomSelect
                  label="Location Type *"
                  name="locationType"
                  value={formData.locationType}
                  onChange={handleLocationTypeChange}
                  options={locationTypes}
                />
              </div>

              {(formData.locationType === "offline" ||
                formData.locationType === "hybrid") && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Venue"
                    name="venue"
                    value={formData.venue}
                    onChange={handleChange}
                    placeholder="Conference Center"
                    leftIcon={<MapPin className="h-4 w-4" />}
                  />
                  <Input
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main St"
                  />
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="San Francisco"
                  />
                  <Input
                    label="Country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="USA"
                  />
                </div>
              )}

              {(formData.locationType === "online" ||
                formData.locationType === "hybrid") && (
                <Input
                  label="Meeting Link"
                  name="meetingLink"
                  value={formData.meetingLink}
                  onChange={handleChange}
                  placeholder="https://zoom.us/j/123456789"
                  leftIcon={<LinkIcon className="h-4 w-4" />}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-[#171717] dark:border-dark-buttonBg">
          <CardHeader>
            <CardTitle className="dark:text-dark-text">Date & Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Start Date *"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                leftIcon={<Calendar className="h-4 w-4" />}
                required
              />
              <Input
                label="Start Time *"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                leftIcon={<Clock className="h-4 w-4" />}
                required
              />
              <Input
                label="End Date"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                leftIcon={<Calendar className="h-4 w-4" />}
              />
              <Input
                label="End Time"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                leftIcon={<Clock className="h-4 w-4" />}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="RSVP Deadline"
                name="rsvpDeadline"
                type="date"
                value={formData.rsvpDeadline}
                onChange={handleChange}
              />
              <Input
                label="Max Attendees"
                name="maxAttendees"
                type="number"
                value={formData.maxAttendees}
                onChange={handleChange}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-[#171717] dark:border-dark-buttonBg">
          <CardHeader>
            <CardTitle className="dark:text-dark-text">Pricing & Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                <CustomSelect
                  label="Currency"
                  name="currency"
                  value={formData.currency}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, currency: value }))
                  }
                  options={[
                    { value: "USD", label: "USD ($)" },
                    { value: "EUR", label: "EUR (€)" },
                    { value: "GBP", label: "GBP (£)" },
                    { value: "INR", label: "INR (₹)" },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Tags (max 10)
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="inline-flex items-center rounded-full bg-secondary-100 px-3 py-1 text-sm text-secondary-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1.5 rounded-full bg-secondary-200 p-0.5 text-secondary-800 hover:bg-secondary-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <Input
                  placeholder="Add a tag (press Enter to add)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  disabled={tags.length >= 10}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Event Image (1 image only)
                </label>
                <div className="flex flex-wrap gap-2">
                  {uploadedImages.map((image, index) => (
                    <ImagePreview
                      key={image.publicId}
                      imageUrl={image.url}
                      onRemove={() => handleRemoveImage(index)}
                      className="aspect-square"
                    />
                  ))}
                  <ImageUpload
                    onImageUploaded={handleImageUploaded}
                    maxSizeInMB={5}
                    allowedTypes={["image/jpeg", "image/jpg", "image/png", "image/webp"]}
                    uploadType="event"
                    className="aspect-square"
                  />
                </div>

                {uploadedImages.length === 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Upload an image for your event (optional)
                  </p>
                )}
                {uploadedImages.length === 1 && (
                  <p className="text-sm text-blue-600 mt-2">
                    Click the upload button above to replace the current image
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-[#171717] dark:border-dark-buttonBg">
          <CardHeader>
            <CardTitle className="dark:text-dark-text">Additional Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Requirements
                </label>
                <div className="space-y-2">
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="flex-1 text-sm bg-gray-50 p-2 rounded">
                        {req}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRequirement(req)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a requirement"
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRequirementAdd}
                    disabled={!requirementInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Event Agenda
                </label>
                <div className="space-y-2">
                  {formData.agenda.map((item, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-dark-buttonBg/20 p-3 rounded border dark:border-dark-buttonBg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-dark-text">
                            <Clock className="h-4 w-4" />
                            {item.time} - {item.title}
                          </div>
                          {item.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                              {item.description}
                            </p>
                          )}
                          {item.speaker && (
                            <p className="mt-1 text-sm text-blue-600 dark:text-dark-button">
                              Speaker: {item.speaker}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAgendaItem(index)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Time (e.g., 09:00 AM)"
                    value={agendaItem.time}
                    onChange={(e) =>
                      setAgendaItem((prev) => ({
                        ...prev,
                        time: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Session title"
                    value={agendaItem.title}
                    onChange={(e) =>
                      setAgendaItem((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={agendaItem.description}
                    onChange={(e) =>
                      setAgendaItem((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Speaker (optional)"
                    value={agendaItem.speaker}
                    onChange={(e) =>
                      setAgendaItem((prev) => ({
                        ...prev,
                        speaker: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAgendaAdd}
                  disabled={!agendaItem.time || !agendaItem.title}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Agenda Item
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={submitting || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditingDraft ? 'Update Draft' : 'Save as Draft'}
          </Button>
          <Button 
            type="submit" 
            disabled={submitting || isSaving}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isEditing ? "Update Event" : "Publish Event"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EventFormPage;
