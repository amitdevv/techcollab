import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import CustomSelect from "../../components/ui/CustomSelect";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import {
  User,
  Bell,
  Globe,
  CreditCard,
  Shield,
  HelpCircle,
  MessageSquare,
  Save,
  Edit,
  UserCircle,
  Mail,
  Phone,
  Settings as SettingsIcon,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

// Enhanced User interface that matches the backend
interface ExtendedUser {
  _id: string;
  email: string;
  name: string;
  username?: string;
  picture?: string;
  picturePublicId?: string;
  bio?: string;
  token?: string;
  role?: string;
  phone?: string;
  profile?: {
    bio?: string;
    location?: string;
    website?: string;
    github?: string;
    twitter?: string;
    linkedin?: string;
    skills: string[];
  };
  preferences?: {
    notifications: {
      email: boolean;
      push: boolean;
      marketplaceAlerts: boolean;
      messageNotifications: boolean;
      eventReminders: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private';
      showEmail: boolean;
      showPhone: boolean;
      searchable: boolean;
    };
    language: string;
    timezone: string;
  };
}

interface AuthContextType {
  user: ExtendedUser | null;
  setUser: (user: ExtendedUser | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const Settings: React.FC = () => {
  const { user, setUser } = useAuth() as AuthContextType;

  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketplaceAlerts: true,
    messageNotifications: true,
    eventReminders: true,
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: "public" as 'public' | 'private',
    showEmail: false,
    showPhone: false,
    searchable: true,
  });

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: user?.bio || user?.profile?.bio || "",
    language: "en",
    timezone: "UTC",
  });

  // Load user preferences on mount
  useEffect(() => {
    if (user?.preferences) {
      setNotifications(user.preferences.notifications);
      setPrivacy(user.preferences.privacy);
      setProfileData(prev => ({
        ...prev,
        language: user.preferences?.language || "en",
        timezone: user.preferences?.timezone || "UTC",
      }));
    }
  }, [user]);

  const saveSettings = async (settingsType: 'notifications' | 'privacy' | 'profile') => {
    if (!user) return;
    
    setIsSaving(true);
    setError(null);

    try {
      const updateData = {
        preferences: {
          ...user.preferences,
          [settingsType]: settingsType === 'notifications' ? notifications : 
                         settingsType === 'privacy' ? privacy : 
                         { language: profileData.language, timezone: profileData.timezone }
        }
      };

      if (settingsType === 'profile') {
        Object.assign(updateData, {
          name: profileData.name,
          phone: profileData.phone,
          bio: profileData.bio,
        });
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const updatedUser = await response.json();
      setUser({ ...user, ...updatedUser });
      
      setSaveSuccess(true);
      toast.success(`${settingsType.charAt(0).toUpperCase() + settingsType.slice(1)} settings saved successfully!`);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleNotification = (key: string) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof notifications],
    }));
  };

  const togglePrivacy = (key: string) => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof privacy],
    }));
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-dark-buttonBg/10 dark:to-dark-buttonBg/5 rounded-xl p-6 shadow-sm border border-green-100 dark:border-dark-buttonBg">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300 text-lg">
          Manage your account preferences and settings
        </p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="bg-green-50 dark:bg-dark-buttonBg/10 border border-green-200 dark:border-dark-buttonBg rounded-2xl p-4 shadow-lg animate-fade-in">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 dark:text-[#219653] mr-3" />
            <p className="text-sm font-medium text-green-800 dark:text-[#219653]">Settings saved successfully!</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-2xl p-4 shadow-lg animate-fade-in">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-sm font-medium text-red-800 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border border-gray-200 dark:border-dark-buttonBg shadow-sm hover:shadow-md transition-shadow rounded-md">
            <CardContent className="p-0">
              <nav className="space-y-1">
                <SettingsNavItem
                  icon={<User className="h-5 w-5" />}
                  label="Profile"
                  isActive={activeTab === "profile"}
                  onClick={() => setActiveTab("profile")}
                />
                <SettingsNavItem
                  icon={<Bell className="h-5 w-5" />}
                  label="Notifications"
                  isActive={activeTab === "notifications"}
                  onClick={() => setActiveTab("notifications")}
                />
                <SettingsNavItem
                  icon={<Globe className="h-5 w-5" />}
                  label="Privacy"
                  isActive={activeTab === "privacy"}
                  onClick={() => setActiveTab("privacy")}
                />
                <SettingsNavItem
                  icon={<HelpCircle className="h-5 w-5" />}
                  label="Help & Support"
                  isActive={activeTab === "help"}
                  onClick={() => setActiveTab("help")}
                />
              </nav>
            </CardContent>
          </Card>

          {/* Account Summary Card */}
          <Card className="border border-gray-200 dark:border-dark-buttonBg shadow-sm hover:shadow-md transition-shadow rounded-md">
            <CardHeader className="border-b border-gray-100 dark:border-dark-buttonBg bg-gray-50/50 dark:bg-dark-buttonBg/10">
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-green-500 dark:text-[#219653]" />
                <CardTitle className="text-lg text-gray-900 dark:text-dark-text">Account Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <Avatar
                  src={user?.picture}
                  alt={user?.name || "User"}
                  size="lg"
                  className="mb-3"
                  status="online"
                />
                <h3 className="font-medium text-gray-900 dark:text-dark-text">
                  {user?.name || "User Name"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                <div className="mt-3">
                  <Badge
                    variant="outline"
                    className="border-green-200 dark:border-[#219653] text-green-600 dark:text-[#219653] bg-green-50 dark:bg-dark-buttonBg/20"
                  >
                    {user?.role || "Premium"} Account
                  </Badge>
                </div>
                <Link
                  to="/profile"
                  className="mt-4 text-xs text-green-600 dark:text-[#219653] hover:text-green-700 dark:hover:text-[#219653]/80 font-medium"
                >
                  View public profile
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-md">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-xl">
                      Profile Information
                    </CardTitle>
                  </div>
                  <Button
                    onClick={() => saveSettings('profile')}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your full name"
                      className="border-green-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <Input
                      value={profileData.email}
                      type="email"
                      placeholder="Your email address"
                      disabled
                      leftIcon={<Mail className="h-4 w-4" />}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Your phone number"
                      leftIcon={<Phone className="h-4 w-4" />}
                      className="border-green-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    className="w-full rounded-md border border-green-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={4}
                    placeholder="Tell us about yourself"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-4">
                    Account Settings
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-6">
                        <p className="font-medium text-gray-700">Language</p>
                        <p className="text-sm text-gray-500">
                          Select your preferred language
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <CustomSelect
                          value={profileData.language}
                          onChange={(value) => setProfileData(prev => ({ ...prev, language: value }))}
                          options={[
                            { value: "en", label: "English" },
                            { value: "es", label: "Spanish" },
                            { value: "fr", label: "French" },
                            { value: "de", label: "German" },
                          ]}
                          className="min-w-[180px]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-6">
                        <p className="font-medium text-gray-700">Time Zone</p>
                        <p className="text-sm text-gray-500">
                          Set your local time zone
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <CustomSelect
                          value={profileData.timezone}
                          onChange={(value) => setProfileData(prev => ({ ...prev, timezone: value }))}
                          options={[
                            { value: "UTC", label: "UTC (GMT+0)" },
                            { value: "America/New_York", label: "Eastern Time (UTC-5)" },
                            { value: "America/Los_Angeles", label: "Pacific Time (UTC-8)" },
                            { value: "Europe/London", label: "Central European Time (UTC+1)" },
                          ]}
                          className="min-w-[220px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-md">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-xl">
                      Notification Settings
                    </CardTitle>
                  </div>
                  <Button
                    onClick={() => saveSettings('notifications')}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">
                        Email Notifications
                      </p>
                      <p className="text-sm text-gray-500">
                        Receive updates via email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.email}
                        onChange={() => toggleNotification("email")}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">
                        Push Notifications
                      </p>
                      <p className="text-sm text-gray-500">
                        Receive mobile and browser notifications
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.push}
                        onChange={() => toggleNotification("push")}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">
                        Marketplace Alerts
                      </p>
                      <p className="text-sm text-gray-500">
                        Get notified about new gigs and opportunities
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.marketplaceAlerts}
                        onChange={() => toggleNotification("marketplaceAlerts")}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">
                        Message Notifications
                      </p>
                      <p className="text-sm text-gray-500">
                        Get notified when you receive a message
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.messageNotifications}
                        onChange={() => toggleNotification("messageNotifications")}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">
                        Event Reminders
                      </p>
                      <p className="text-sm text-gray-500">
                        Get reminded about upcoming events
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.eventReminders}
                        onChange={() => toggleNotification("eventReminders")}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Privacy Settings */}
          {activeTab === "privacy" && (
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-md">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-xl">Privacy Settings</CardTitle>
                  </div>
                  <Button
                    onClick={() => saveSettings('privacy')}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Privacy Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">
                      Profile Visibility
                    </h3>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="visibility"
                          value="public"
                          checked={privacy.profileVisibility === "public"}
                          onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value as 'public' | 'private' }))}
                          className="form-radio text-green-600 focus:ring-green-500"
                        />
                        <span>Public (Anyone can view your profile)</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="visibility"
                          value="private"
                          checked={privacy.profileVisibility === "private"}
                          onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value as 'public' | 'private' }))}
                          className="form-radio text-green-600 focus:ring-green-500"
                        />
                        <span>
                          Private (Only connected users can view your profile)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="font-medium text-gray-900 mb-4">
                      Contact Information
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-700">
                            Show Email Address
                          </p>
                          <p className="text-sm text-gray-500">
                            Allow others to see your email address
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={privacy.showEmail}
                            onChange={() => togglePrivacy("showEmail")}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-700">
                            Show Phone Number
                          </p>
                          <p className="text-sm text-gray-500">
                            Allow others to see your phone number
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={privacy.showPhone}
                            onChange={() => togglePrivacy("showPhone")}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-700">
                            Allow Search Engines
                          </p>
                          <p className="text-sm text-gray-500">
                            Make your profile discoverable in search engines
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={privacy.searchable}
                            onChange={() => togglePrivacy("searchable")}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help & Support */}
          {activeTab === "help" && (
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-md">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-xl">Help & Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 mb-4">
                    Frequently Asked Questions
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
                      <h4 className="font-medium text-gray-800">
                        How do I update my profile information?
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        You can update your profile information from the Profile
                        tab in your settings.
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
                      <h4 className="font-medium text-gray-800">
                        How do I change my notification preferences?
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Visit the Notifications tab to customize which alerts you receive via email and push notifications.
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
                      <h4 className="font-medium text-gray-800">
                        How do I control my privacy settings?
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Use the Privacy tab to control who can see your profile and contact information.
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-100 rounded-md p-4">
                      <div className="flex items-start">
                        <div className="mr-3 text-green-600">
                          <SettingsIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-green-800">
                            Need more help?
                          </h3>
                          <p className="text-sm text-green-600 mb-3">
                            Our support team is here to help you with any
                            questions or issues.
                          </p>
                          <Button
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                          >
                            Contact Support
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Navigation item component
const SettingsNavItem = ({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "text-green-600 bg-green-50/50"
          : "text-gray-600 hover:text-green-600 hover:bg-green-50/30"
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
};

export default Settings;
