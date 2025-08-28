import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useUserStats } from "../../hooks/useUserStats";
import { userStatsApi } from "../../services/userStatsApi";
import { 
  validateImageFile, 
  ImageValidationPresets, 
  getOptimizedImageUrl,
  createImagePreview 
} from "../../lib/imageUtils";
import {
  UserCircle,
  CircleDollarSign ,
  Mail,
  LogOut,
  BadgeCheck ,
  Edit3,
  Github,
  Globe,
  MapPin,
  Twitter,
  Linkedin,
  Camera,
  X,
  Plus,
  CheckCircle,
  AlertCircle,
  Star,
  Award,
  Target,
  TrendingUp,
  RefreshCw,
  CalendarDays
} from "lucide-react";
import Button from "../../components/ui/Button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";

interface User {
  _id: string;
  token: string;
  email: string;
  name: string;
  username: string;
  picture?: string;
  picturePublicId?: string;
  bio?: string;
  profile?: {
    bio?: string;
    location?: string;
    website?: string;
    github?: string;
    twitter?: string;
    linkedin?: string;
    skills: string[];
  };
  skills: string[];
  stats?: {
    activeGigs?: number;
    events?: number;
    messages?: number;
  };
}

interface FormData {
  bio: string;
  location: string;
  website: string;
  github: string;
  twitter: string;
  linkedin: string;
  skills: string[];
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const Profile: React.FC = () => {
  const { user, setUser, isAuthenticated, isLoading, logout } =
    useAuth() as AuthContextType;
  const navigate = useNavigate();
  
  // Fetch real user statistics
  const { 
    stats: userStats, 
    isLoading: statsLoading, 
    error: statsError, 
    refreshStats,
    lastUpdated 
  } = useUserStats(user?._id, user?.token);

  const {
    uploadImage,
    isUploading: imageUploading,
    error: imageUploadError,
  } = useImageUpload();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    bio: user?.profile?.bio || "",
    location: user?.profile?.location || "",
    website: user?.profile?.website || "",
    github: user?.profile?.github || "",
    twitter: user?.profile?.twitter || "",
    linkedin: user?.profile?.linkedin || "",
    skills: user?.profile?.skills || [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync formData with user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.profile?.bio || "",
        location: user.profile?.location || "",
        website: user.profile?.website || "",
        github: user.profile?.github || "",
        twitter: user.profile?.twitter || "",
        linkedin: user.profile?.linkedin || "",
        skills: user.profile?.skills || [],
      });
    }
  }, [user]);

  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    
    try {
      // Validate the image file using the new validation system
      const validation = validateImageFile(file, ImageValidationPresets.profile);
      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid image file');
        return;
      }

      // Create preview using the new utility
      const preview = await createImagePreview(file);
      setImagePreview(preview);

      // Start the upload process
      handleImageUpload(e);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image file');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user) return;

    const file = e.target.files[0];
    setUploadingImage(true);
    setUploadError(null);

    try {
      console.log('Starting profile picture upload:', {
        filename: file.name,
        size: file.size,
        type: file.type
      });

      // Upload using specialized profile image upload
      const { url, publicId } = await uploadImage(file, { 
        type: 'profile'
      });

      if (!url || !publicId) {
        throw new Error("Invalid response from image upload");
      }

      console.log('Image uploaded to Cloudinary:', { url, publicId });

      // Update user profile with new image
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${user._id}/picture`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ 
            picture: url, 
            picturePublicId: publicId 
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to update profile picture"
        );
      }

      const updatedUserData = await response.json();
      console.log('Profile picture update response:', updatedUserData);
      
      // Update user state with new image data
      const mappedUser = {
        ...user!,
        bio: updatedUserData.bio,
        picture: updatedUserData.picture || url,
        picturePublicId: updatedUserData.picturePublicId || publicId,
        profile: {
          bio: updatedUserData.profile?.bio || updatedUserData.bio,
          location: updatedUserData.profile?.location,
          website: updatedUserData.profile?.website,
          github: updatedUserData.profile?.github,
          twitter: updatedUserData.profile?.twitter,
          linkedin: updatedUserData.profile?.linkedin,
          skills: updatedUserData.profile?.skills || [],
        },
        skills: updatedUserData.profile?.skills || [],
      };
      
      setUser(mappedUser);
      
      setImagePreview(null);

      setUploadSuccess(true);
      toast.success("Profile picture updated successfully");
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      const message =
        error instanceof Error ? error.message : "Failed to upload image";
      setUploadError(message);
      toast.error(message);
    } finally {
      setUploadingImage(false);
      // Clear the file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);
    try {
      console.log('Saving profile with formData:', formData);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${user?._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify({
            ...formData,
            picture: user?.picture,
            picturePublicId: user?.picturePublicId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save profile");
      }

      const updatedUser = await response.json();
      console.log('Received updated user from backend:', updatedUser);
      
      // Map the response correctly to match the frontend User interface
      const mappedUser = {
        ...user!,
        bio: updatedUser.bio,
        picture: updatedUser.picture,
        picturePublicId: updatedUser.picturePublicId,
        profile: {
          bio: updatedUser.profile?.bio || updatedUser.bio,
          location: updatedUser.profile?.location,
          website: updatedUser.profile?.website,
          github: updatedUser.profile?.github,
          twitter: updatedUser.profile?.twitter,
          linkedin: updatedUser.profile?.linkedin,
          skills: updatedUser.profile?.skills || [],
        },
        skills: updatedUser.profile?.skills || [],
      };
      
      console.log('Mapped user for frontend:', mappedUser);
      setUser(mappedUser);
      setIsEditing(false);
      setSaveSuccess(true);
      toast.success("Profile updated successfully");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save profile";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  // Quick action handlers
  const handleViewMessages = () => {
    navigate('/inbox');
  };

  const handleMyEvents = () => {
    navigate('/events');
  };

  const handleActiveGigs = () => {
    navigate('/marketplace');
  };

  // Stats click handlers
  const handleStatsClick = (statLabel: string) => {
    switch (statLabel) {
      case 'Active Gigs':
        navigate('/marketplace');
        break;
      case 'Events':
        navigate('/events');
        break;
      case 'Messages':
        navigate('/inbox');
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 h-16 w-16 animate-pulse rounded-full bg-indigo-100 opacity-25 mx-auto"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading your profile...</p>
          <p className="text-sm text-gray-500">Just a moment</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const stats = [
    {
      label: "Active Gigs",
      value: userStats?.activeGigs?.toString() || "0",
      icon: CircleDollarSign,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      change: userStats?.changes?.activeGigs || 0,
      isLoading: statsLoading,
    },
    {
      label: "Events",
      value: userStats?.events?.toString() || "0",
      icon: CalendarDays,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      change: userStats?.changes?.events || 0,
      isLoading: statsLoading,
    },
    {
      label: "Messages",
      value: userStats?.messages?.toString() || "0",
      icon: Mail,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      change: userStats?.changes?.messages || 0,
      isLoading: statsLoading,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-[#232323] dark:via-[#232323] dark:to-[#232323]">
      {/* Background decorations */}
      {/* <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-green-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-60 h-60 bg-gradient-to-r from-green-400 to-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div> */}

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto dark-typography">
        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="bg-green-50 dark:bg-[#232323] border border-green-200 dark:border-[#404040] rounded-2xl p-4 shadow-lg animate-fade-in">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-[#219653] mr-3" />
              <p className="text-sm font-medium text-green-800 dark:text-[#219653]">Profile updated successfully!</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 dark:bg-[#232323] border border-red-200 dark:border-[#404040] rounded-2xl p-4 shadow-lg animate-fade-in">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-sm font-medium text-red-800 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleProfilePictureChange}
          accept="image/*"
          className="hidden"
        />

        {/* Upload status messages */}
        {uploadSuccess && (
          <div className="mb-6 backdrop-blur-sm bg-green-50/80 border border-green-200 rounded-2xl p-4 shadow-lg animate-fade-in">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <p className="text-sm font-medium text-green-800">Profile picture updated successfully!</p>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="mb-6 backdrop-blur-sm bg-red-50/80 border border-red-200 rounded-2xl p-4 shadow-lg animate-fade-in">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-sm font-medium text-red-800">{uploadError}</p>
            </div>
          </div>
        )}

        {/* Profile Header - Enhanced */}
        <div className="mb-8 bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#404040] rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="relative px-6 sm:px-8 py-8 bg-white dark:bg-[#232323]">
            {/* Profile Picture */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-6">
              <div className="relative group flex-shrink-0">
                <div className="relative h-32 w-32 sm:h-36 sm:w-36 overflow-hidden rounded-2xl border-6 border-white bg-white  shadow-2xl">
                  {imagePreview || user?.picture ? (
                    <img
                      src={imagePreview || getOptimizedImageUrl(user?.picture || '', { 
                        width: 400, 
                        height: 400, 
                        crop: 'fill',
                        cacheBust: true 
                      })}
                      alt={user?.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-[#232323]">
                      {uploadingImage ? (
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-300 border-t-indigo-600"></div>
                      ) : (
                        <UserCircle className="h-20 w-20 text-indigo-400" />
                      )}
                    </div>
                  )}
                  
                  {/* Camera overlay */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Camera className="h-8 w-8 text-white" />
                    )}
                  </button>
                </div>
                
                {/* Status indicator - show only when a profile image exists */}
                {(imagePreview || user?.picture) && (
                  <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-green-500 border-3 border-white dark:border-[#232323] rounded-full shadow-lg"></div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                      {user?.name}
                    </h1>
                    <div className="flex items-center justify-center sm:justify-start text-gray-600 mb-3">
                      <Mail className="h-4 w-4 mr-2 text-indigo-500" />
                      <span className="text-sm sm:text-base">{user?.email}</span>
                    </div>
                    <div className="inline-flex items-center   text-md font-medium  text-[#6265ee]">
                    <BadgeCheck className="h-6 w-6 mr-2 text-indigo-500" />
                    Premium Member
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center sm:justify-end gap-3 mt-4 sm:mt-0">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          variant="primary"
                          className="px-6"
                        >
                          {isSaving ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setIsEditing(false)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      onClick={logout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-12">
          {/* Left Column - Profile Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* About Section */}
            <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#404040] rounded-2xl shadow-xl overflow-hidden animate-slide-in">
              <div className="border-b border-gray-200 dark:border-[#404040] p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center">
                  <Award className="h-5 w-5 mr-2 text-indigo-600 dark:text-[#219653]" />
                  About
                </h2>
              </div>
              <div className="p-6">
                {isEditing ? (
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full "
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {formData.bio || "No bio provided yet. Click edit to add your story!"}
                  </p>
                )}
              </div>
            </div>

            {/* Skills Section */}
            <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#404040] rounded-2xl shadow-xl overflow-hidden animate-slide-in animation-delay-100">
              <div className="border-b border-gray-200 dark:border-[#404040] p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-600 dark:text-[#219653]" />
                  Skills
                </h2>
              </div>
              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium shadow-sm bg-gray-100 text-gray-700 dark:bg-[#232323] dark:text-white dark:border dark:border-[#404040]"
                        >
                          {skill}
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-2 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill..."
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      />
                      <Button
                        onClick={handleAddSkill}
                        variant="primary"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.length > 0 ? (
                      formData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium shadow-sm hover:shadow-md transition-shadow bg-gray-100 text-gray-700 dark:bg-[#232323] dark:text-white dark:border dark:border-[#404040]"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No skills listed yet. Add some to showcase your expertise!</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="backdrop-blur-xl bg-white/40 dark:bg-dark-buttonBg/10 border border-white/20 dark:border-dark-buttonBg/20 rounded-2xl shadow-xl overflow-hidden animate-slide-in animation-delay-200">
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-dark-buttonBg/30 dark:to-dark-buttonBg/20 border-b border-white/20 dark:border-dark-buttonBg/20 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-blue-600 dark:text-[#219653]" />
                  Contact Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <Input
                        leftIcon={<MapPin className="h-4 w-4 text-gray-400" />}
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <Input
                        leftIcon={<Globe className="h-4 w-4 text-gray-400" />}
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center p-3 rounded-xl bg-[#f0f0f0] dark:bg-dark-buttonBg/20 backdrop-blur-sm">
                      <MapPin className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                      <span className="text-gray-700">{formData.location || "add your Location"}</span>
                    </div>
                    <div className="flex items-center p-3 rounded-xl bg-[#f0f0f0] dark:bg-dark-buttonBg/20 backdrop-blur-sm">
                      <Globe className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                      {formData.website ? (
                        <a
                          href={formData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 hover:underline break-all transition-colors"
                        >
                          {formData.website}
                        </a>
                      ) : (
                        <span className="text-gray-700">add your Website</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="backdrop-blur-xl bg-white/40 dark:bg-dark-buttonBg/10 border border-white/20 dark:border-dark-buttonBg/20 rounded-2xl shadow-xl overflow-hidden animate-slide-in animation-delay-300">
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-dark-buttonBg/30 dark:to-dark-buttonBg/20 border-b border-white/20 dark:border-dark-buttonBg/20 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-purple-600 dark:text-[#219653]" />
                  Social Presence
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                      <Input
                        leftIcon={<Github className="h-4 w-4 text-gray-400" />}
                        value={formData.github}
                        onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                      <Input
                        leftIcon={<Twitter className="h-4 w-4 text-gray-400" />}
                        value={formData.twitter}
                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                      <Input
                        leftIcon={<Linkedin className="h-4 w-4 text-gray-400" />}
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        placeholder="profile-name"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center p-3 rounded-xl bg-[#f0f0f0] dark:bg-dark-buttonBg/20 backdrop-blur-sm  group">
                      <Github className="h-5 w-5 mr-3 text-purple-600 flex-shrink-0" />
                      {formData.github ? (
                        <a
                          href={`https://github.com/${formData.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 font-medium group-hover:underline transition-colors"
                        >
                          {formData.github}
                        </a>
                      ) : (
                        <span className="text-gray-700">connect your GitHub</span>
                      )}
                    </div>
                    <div className="flex items-center p-3 rounded-xl bg-[#f0f0f0] dark:bg-dark-buttonBg/20 backdrop-blur-sm  group">
                      <Twitter className="h-5 w-5 mr-3 text-purple-600 flex-shrink-0" />
                      {formData.twitter ? (
                        <a
                          href={`https://twitter.com/${formData.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 font-medium group-hover:underline transition-colors"
                        >
                          @{formData.twitter}
                        </a>
                      ) : (
                        <span className="text-gray-700">connect your Twitter</span>
                      )}
                    </div>
                    <div className="flex items-center p-3 rounded-xl bg-[#f0f0f0] dark:bg-dark-buttonBg/20 backdrop-blur-sm group">
                      <Linkedin className="h-5 w-5 mr-3 text-purple-600 flex-shrink-0" />
                      {formData.linkedin ? (
                        <a
                          href={`https://linkedin.com/in/${formData.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 font-medium group-hover:underline transition-colors"
                        >
                          {formData.linkedin}
                        </a>
                      ) : (
                        <span className="text-gray-700">connect your LinkedIn</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats and Quick Actions */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Actions */}
            <div className="backdrop-blur-xl bg-white/40 dark:bg-dark-buttonBg/10 border border-white/20 dark:border-dark-buttonBg/20 rounded-2xl shadow-xl overflow-hidden animate-slide-in animation-delay-700">
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-dark-buttonBg/30 dark:to-dark-buttonBg/20 border-b border-white/20 dark:border-dark-buttonBg/20 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <Button 
                  onClick={handleViewMessages}
                  className="w-full justify-start  "
                  variant="secondary"
                >
                  <Mail  className="h-6 w-6 mr-3" />
                  View Messages
                </Button>
                <Button 
                  onClick={handleMyEvents}
                  variant="secondary" 
                  className="w-full justify-start border-purple-600 text-purple-600 "

                >
                  <CalendarDays className="h-6 w-6 mr-3" />
                  My Events
                </Button>
                <Button 
                  onClick={handleActiveGigs}
                  variant="secondary" 
                  className="w-full justify-start "


                >
                  <CircleDollarSign  className="h-6 w-6 mr-3" />
                  Active Gigs
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Your Statistics</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshStats}
                  disabled={statsLoading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {statsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">Failed to load stats: {statsError}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshStats}
                    className="mt-1 text-red-600 hover:text-red-700"
                  >
                    Retry
                  </Button>
                </div>
              )}
              
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  onClick={() => handleStatsClick(stat.label)}
                  className={`bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#404040] rounded-2xl shadow-xl overflow-hidden animate-slide-in hover:scale-105 transition-all duration-300 group cursor-pointer`}
                  style={{ animationDelay: `${(index + 4) * 100}ms` }}
                >
                  <div className={`p-6`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-xl bg-[#219653] shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.label}</p>
                          {stat.isLoading ? (
                            <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                          ) : (
                            <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">{stat.value}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {stat.isLoading ? (
                          <div className="space-y-1">
                            <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        ) : (
                          <>
                            <div className={`flex items-center text-sm font-medium ${
                              stat.change > 0 ? 'text-green-600' : 
                              stat.change < 0 ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              <TrendingUp className={`h-4 w-4 mr-1 ${
                                stat.change < 0 ? 'rotate-180' : ''
                              }`} />
                              {userStatsApi.formatPercentageChange(stat.change)}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">vs last month</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {lastUpdated && !statsLoading && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Achievement Badge */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-50/40 to-orange-50/40 dark:from-dark-buttonBg/20 dark:to-dark-buttonBg/10 border border-yellow-200/50 dark:border-dark-buttonBg/20 rounded-2xl shadow-xl overflow-hidden animate-slide-in animation-delay-800">
              <div className="p-6 text-center">
               
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">Top Performer</h3>
                <p className="text-sm text-gray-600 dark:text-gray-500 mb-4">You're in the top 10% of active members this month!</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
