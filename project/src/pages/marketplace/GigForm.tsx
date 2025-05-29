import React, { useState, useEffect } from "react";
import {
  Save,
  Plus,
  X,
  Briefcase,
  DollarSign,
  Tag,
  Clock,
  FileText,
  Loader2,
  Check,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { gigApi, Gig } from "../../services/gigApi";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import CustomSelect from "../../components/ui/CustomSelect";
import Textarea from "../../components/ui/Textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";

const categories = [
  { value: "web", label: "Web Development" },
  { value: "mobile", label: "Mobile Development" },
  { value: "design", label: "UI/UX Design" },
  { value: "data", label: "Data Science" },
  { value: "devops", label: "DevOps" },
  { value: "writing", label: "Writing & Translation" },
  { value: "marketing", label: "Digital Marketing" },
];

const subCategories: Record<string, { value: string; label: string }[]> = {
  web: [
    { value: "frontend", label: "Frontend Development" },
    { value: "backend", label: "Backend Development" },
    { value: "fullstack", label: "Full Stack Development" },
    { value: "wordpress", label: "WordPress" },
    { value: "ecommerce", label: "E-commerce" },
  ],
  mobile: [
    { value: "ios", label: "iOS Development" },
    { value: "android", label: "Android Development" },
  ],
  design: [
    { value: "ui", label: "UI Design" },
    { value: "ux", label: "UX Design" },
    { value: "graphic", label: "Graphic Design" },
    { value: "logo", label: "Logo Design" },
  ],
  data: [
    { value: "analysis", label: "Data Analysis" },
    { value: "ml", label: "Machine Learning" },
    { value: "visualization", label: "Data Visualization" },
  ],
  devops: [
    { value: "cicd", label: "CI/CD" },
    { value: "cloud", label: "Cloud Services" },
    { value: "infrastructure", label: "Infrastructure" },
  ],
  writing: [
    { value: "copywriting", label: "Copywriting" },
    { value: "technical", label: "Technical Writing" },
    { value: "content", label: "Content Writing" },
  ],
  marketing: [
    { value: "seo", label: "SEO" },
    { value: "social", label: "Social Media" },
    { value: "ads", label: "Advertising" },
  ],
};

const deliveryOptions = [
  { value: "1", label: "1 day" },
  { value: "3", label: "3 days" },
  { value: "7", label: "1 week" },
  { value: "14", label: "2 weeks" },
  { value: "30", label: "1 month" },
];

const GigFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subCategory: "",
    price: "",
    deliveryTime: "7",
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      loadGigData();
    }
  }, [isEditing, id]);

  const loadGigData = async () => {
    try {
      setLoading(true);
      const gig = await gigApi.getGigById(id!);
      setFormData({
        title: gig.title,
        description: gig.description,
        category: gig.category,
        subCategory: gig.subCategory,
        price: gig.price.toString(),
        deliveryTime: gig.deliveryTime,
        tags: gig.tags || [],
      });
    } catch (error) {
      console.error("Error loading gig:", error);
      toast.error("Failed to load gig data");
      navigate("/marketplace");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Reset subcategory when category changes
    if (name === "category") {
      setFormData((prev) => ({ ...prev, subCategory: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();

    // Basic validation without user check
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (!formData.category) {
      toast.error("Category is required");
      return;
    }

    if (!formData.subCategory) {
      toast.error("Sub-category is required");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Valid price is required");
      return;
    }

    try {
      setSubmitting(true);

      const gigData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subCategory: formData.subCategory,
        price: parseFloat(formData.price),
        deliveryTime: formData.deliveryTime,
        tags: formData.tags,
        status: isDraft ? ("draft" as const) : ("active" as const),
      };

      let response: Gig;
      if (isEditing) {
        response = await gigApi.updateGig(id!, gigData);
        toast.success("Gig updated successfully!");
      } else if (isDraft) {
        response = await gigApi.saveGigDraft(gigData);
        toast.success("Gig saved as draft!");
      } else {
        response = await gigApi.createGig(gigData);
        toast.success("Gig published successfully!");
      }

      navigate(`/marketplace/${response._id || response.id}`);
    } catch (error) {
      console.error("Error saving gig:", error);
      toast.error(isDraft ? "Failed to save draft" : "Failed to save gig");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-100/40 flex items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-emerald-400 opacity-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50/30 to-teal-100/40 dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-green-600/20 dark:from-emerald-600/10 dark:to-green-800/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-600/20 dark:from-green-600/10 dark:to-emerald-800/10 rounded-full blur-3xl animate-float animation-delay-2000"></div>
      </div>

      <div className="relative z-10 p-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-green-600/10 to-emerald-600/10 dark:from-emerald-600/5 dark:via-green-600/5 dark:to-emerald-600/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/90 dark:bg-[#171717]/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-emerald-100/50 dark:border-dark-buttonBg">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-emerald-700 dark:text-dark-button hover:bg-emerald-50 dark:hover:bg-dark-buttonBg/30 p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 dark:from-dark-button dark:via-dark-button dark:to-dark-button bg-clip-text text-transparent">
                  {isEditing ? "Edit Gig" : "Create New Gig"}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  {isEditing ? "Update your service details" : "Share your expertise with the world"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
          {/* Gig Information Card */}
          <Card className="relative bg-white/90 dark:bg-[#171717]/90 backdrop-blur-md rounded-2xl shadow-xl border border-emerald-100/50 dark:border-dark-buttonBg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 dark:from-emerald-600/5 dark:to-green-600/5"></div>
            <CardHeader className="relative border-b border-emerald-100/50 dark:border-dark-buttonBg bg-gradient-to-r from-emerald-50/50 to-green-50/50 dark:from-emerald-900/10 dark:to-green-900/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-md">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800 dark:text-dark-text">
                  Gig Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-600" />
                  Gig Title *
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="I will create a modern, responsive website for your business"
                  className="bg-white/70 border-emerald-200/50 focus:border-emerald-500 rounded-xl text-base py-3"
                  required
                />
                <p className="text-xs text-gray-500">
                  Write a clear, compelling title that describes what you'll deliver
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Description *
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your service in detail. What will you deliver? What makes your service unique? What's included?"
                  className="w-full h-32 bg-white/70 border-emerald-200/50 focus:border-emerald-500 rounded-xl p-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
                <p className="text-xs text-gray-500">
                  Provide a detailed description of your service (minimum 100 characters)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-emerald-600" />
                    Category *
                  </label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Select a category" },
                      ...categories,
                    ]}
                    value={formData.category}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, category: value, subCategory: "" }))
                    }
                    className="bg-white/70 border-emerald-200/50 focus:border-emerald-500 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-emerald-600" />
                    Sub-Category *
                  </label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Select a sub-category" },
                      ...(subCategories[formData.category] || []),
                    ]}
                    value={formData.subCategory}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, subCategory: value }))
                    }
                    className="bg-white/70 border-emerald-200/50 focus:border-emerald-500 rounded-xl"
                    disabled={!formData.category}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Price (USD) *
                  </label>
                  <Input
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="50"
                    min="5"
                    step="0.01"
                    className="bg-white/70 border-emerald-200/50 focus:border-emerald-500 rounded-xl"
                    required
                  />
                  <p className="text-xs text-gray-500">Minimum price is $5</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    Delivery Time *
                  </label>
                  <CustomSelect
                    options={deliveryOptions}
                    value={formData.deliveryTime}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, deliveryTime: value }))
                    }
                    className="bg-white/70 border-emerald-200/50 focus:border-emerald-500 rounded-xl"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media & Additional Details */}
          <Card className="relative bg-white/90 dark:bg-[#171717]/90 backdrop-blur-md rounded-2xl shadow-xl border border-emerald-100/50 dark:border-dark-buttonBg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-green-600/5 dark:to-emerald-600/5"></div>
            <CardHeader className="relative border-b border-green-100/50 dark:border-dark-buttonBg bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800 dark:text-dark-text">Media & Tags</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-emerald-600 dark:text-dark-button" />
                  Skills & Tags
                </label>
                <div className="flex flex-wrap gap-3 mb-4">
                  {formData.tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-700 dark:text-dark-button px-3 py-2 rounded-xl border border-emerald-200/50 dark:border-dark-buttonBg"
                    >
                      <span className="text-sm font-medium">{tag}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            tags: prev.tags.filter((t) => t !== tag),
                          }));
                        }}
                        className="text-emerald-600 dark:text-dark-button hover:text-emerald-800 dark:hover:text-dark-button/80 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                          setFormData((prev) => ({
                            ...prev,
                            tags: [...prev.tags, tagInput.trim()],
                          }));
                          setTagInput("");
                        }
                      }
                    }}
                    placeholder="Add a skill (e.g., React, Design, SEO)"
                    className="bg-white/70 border-emerald-200/50 focus:border-emerald-500 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                        setFormData((prev) => ({
                          ...prev,
                          tags: [...prev.tags, tagInput.trim()],
                        }));
                        setTagInput("");
                      }
                    }}
                    disabled={!tagInput.trim() || formData.tags.length >= 10}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Add relevant skills and keywords that buyers might search for (max 10 tags)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              disabled={submitting}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 backdrop-blur-sm rounded-xl px-8 py-3 text-base font-semibold"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save as Draft
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 text-base font-semibold shadow-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transform hover:scale-105 transition-all duration-300 rounded-xl"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {isEditing ? "Update Gig" : "Publish Gig"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GigFormPage;
