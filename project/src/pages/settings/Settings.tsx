import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import CustomSelect from "../../components/ui/CustomSelect";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import {
  User, Bell, Globe, HelpCircle, Save, UserCircle, Mail, Phone, Settings as SettingsIcon,
  CheckCircle, AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

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
    email: true, push: true, marketplaceAlerts: true, messageNotifications: true, eventReminders: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: "public" as 'public' | 'private', showEmail: false, showPhone: false, searchable: true
  });

  const [profileData, setProfileData] = useState({
    name: user?.name || "", email: user?.email || "", phone: user?.phone || "",
    bio: user?.bio || user?.profile?.bio || "", language: "en", timezone: "UTC"
  });

  useEffect(() => {
    if (user?.preferences) {
      setNotifications(user.preferences.notifications);
      setPrivacy(user.preferences.privacy);
      setProfileData(prev => ({
        ...prev, language: user.preferences?.language || "en", timezone: user.preferences?.timezone || "UTC"
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
          name: profileData.name, phone: profileData.phone, bio: profileData.bio
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

      if (!response.ok) throw new Error('Failed to save settings');

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
    setNotifications((prev) => ({ ...prev, [key]: !prev[key as keyof typeof notifications] }));
  };

  const togglePrivacy = (key: string) => {
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key as keyof typeof privacy] }));
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User className="h-5 w-5" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
    { id: "privacy", label: "Privacy", icon: <Globe className="h-5 w-5" /> },
    { id: "help", label: "Help & Support", icon: <HelpCircle className="h-5 w-5" /> }
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#219653]/10 to-[#219653]/5 rounded-2xl p-6 border border-[#219653]/20">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Manage your account preferences and settings</p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="bg-[#219653]/10 border border-[#219653]/20 rounded-xl p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-[#219653] mr-3" />
          <p className="text-sm font-medium text-[#219653]">Settings saved successfully!</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-xl p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <p className="text-sm font-medium text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Navigation Tabs */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "text-white bg-[#219653] shadow-lg"
                        : "text-gray-600 dark:text-gray-300 hover:text-[#219653] dark:hover:text-[#219653] hover:bg-[#219653]/10 dark:hover:bg-[#219653]/10"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Account Summary */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-[#219653]/5 to-[#219653]/10">
            <CardHeader className="border-b border-[#219653]/20 bg-[#219653]/5">
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-[#219653]" />
                <CardTitle className="text-lg text-gray-900 dark:text-white">Account Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 text-center">
              <Avatar src={user?.picture} alt={user?.name || "User"} size="lg" className="mb-3 mx-auto" />
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">{user?.name || "User Name"}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{user?.email}</p>
              <Badge variant="outline" className="border-[#219653] text-[#219653] bg-[#219653]/10">
                {user?.role || "Premium"} Account
              </Badge>
              <Link to="/profile" className="block mt-3 text-xs text-[#219653] hover:text-[#219653]/80 font-medium">
                View public profile
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-[#3b3b3b]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-[#219653]" />
                    <CardTitle className="text-xl text-gray-900 dark:text-white">Profile Information</CardTitle>
                  </div>
                  <Button
                    onClick={() => saveSettings('profile')}
                    disabled={isSaving}
                    className="bg-[#219653] hover:bg-[#219653]/90 text-white shadow-lg"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <Input
                      value={profileData.email}
                      type="email"
                      placeholder="Your email address"
                      disabled
                      leftIcon={<Mail className="h-4 w-4" />}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Your phone number"
                      leftIcon={<Phone className="h-4 w-4" />}
                    />
                  </div>
                </div>

                <div>
                  <Textarea
                    label="Bio"
                    placeholder="Tell us about yourself"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    className="border-gray-200 dark:border-gray-600 focus:border-[#219653] focus:ring-[#219653]"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Account Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-6">
                        <p className="font-medium text-gray-700 dark:text-gray-300">Language</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Select your preferred language</p>
                      </div>
                      <CustomSelect
                        value={profileData.language}
                        onChange={(value) => setProfileData(prev => ({ ...prev, language: value }))}
                        options={[
                          { value: "en", label: "English" },
                          { value: "es", label: "Spanish" },
                          { value: "fr", label: "French" },
                          { value: "de", label: "German" }
                        ]}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-6">
                        <p className="font-medium text-gray-700 dark:text-gray-300">Time Zone</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Set your local time zone</p>
                      </div>
                      <CustomSelect
                        value={profileData.timezone}
                        onChange={(value) => setProfileData(prev => ({ ...prev, timezone: value }))}
                        options={[
                          { value: "UTC", label: "UTC (GMT+0)" },
                          { value: "America/New_York", label: "Eastern Time (UTC-5)" },
                          { value: "America/Los_Angeles", label: "Pacific Time (UTC-8)" },
                          { value: "Europe/London", label: "Central European Time (UTC+1)" }
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-[#3b3b3b]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-[#219653]" />
                    <CardTitle className="text-xl text-gray-900 dark:text-white">Notification Settings</CardTitle>
                  </div>
                  <Button
                    onClick={() => saveSettings('notifications')}
                    disabled={isSaving}
                    className="bg-[#219653] hover:bg-[#219653]/90 text-white shadow-lg"
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
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Object.entries({
                    email: "Email Notifications",
                    push: "Push Notifications", 
                    marketplaceAlerts: "Marketplace Alerts",
                    messageNotifications: "Message Notifications",
                    eventReminders: "Event Reminders"
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#3b3b3b] rounded-lg">
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          {key === 'email' && "Receive updates via email"}
                          {key === 'push' && "Receive mobile and browser notifications"}
                          {key === 'marketplaceAlerts' && "Get notified about new gigs and opportunities"}
                          {key === 'messageNotifications' && "Get notified when you receive a message"}
                          {key === 'eventReminders' && "Get reminded about upcoming events"}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifications[key as keyof typeof notifications]}
                          onChange={() => toggleNotification(key)}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#219653]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#219653]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Privacy Settings */}
          {activeTab === "privacy" && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-[#3b3b3b]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-[#219653]" />
                    <CardTitle className="text-xl text-gray-900 dark:text-white">Privacy Settings</CardTitle>
                  </div>
                  <Button
                    onClick={() => saveSettings('privacy')}
                    disabled={isSaving}
                    className="bg-[#219653] hover:bg-[#219653]/90 text-white shadow-lg"
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
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Profile Visibility</h3>
                  <div className="space-y-3">
                    {[
                      { value: "public", label: "Public (Anyone can view your profile)" },
                      { value: "private", label: "Private (Only connected users can view your profile)" }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-50 dark:bg-[#3b3b3b] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <input
                          type="radio"
                          name="visibility"
                          value={option.value}
                          checked={privacy.profileVisibility === option.value}
                          onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value as 'public' | 'private' }))}
                          className="form-radio text-[#219653] focus:ring-[#219653]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 ">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    {[
                      { key: "showEmail", label: "Show Email Address", desc: "Allow others to see your email address" },
                      { key: "showPhone", label: "Show Phone Number", desc: "Allow others to see your phone number" },
                      { key: "searchable", label: "Allow Search Engines", desc: "Make your profile discoverable in search engines" }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#3b3b3b] rounded-lg">
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">{item.label}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-300">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={privacy[item.key as keyof typeof privacy] as boolean}
                            onChange={() => togglePrivacy(item.key)}
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#219653]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#219653]"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help & Support */}
          {activeTab === "help" && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-[#3b3b3b]">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-[#219653]" />
                  <CardTitle className="text-xl text-gray-900 dark:text-white">Help & Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h3>
                  {[
                    {
                      question: "How do I update my profile information?",
                      answer: "You can update your profile information from the Profile tab in your settings."
                    },
                    {
                      question: "How do I change my notification preferences?",
                      answer: "Visit the Notifications tab to customize which alerts you receive via email and push notifications."
                    },
                    {
                      question: "How do I control my privacy settings?",
                      answer: "Use the Privacy tab to control who can see your profile and contact information."
                    }
                  ].map((faq, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-[#3b3b3b] rounded-lg cursor-pointer">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200  mb-1">{faq.question}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{faq.answer}</p>
                    </div>
                  ))}

                  <div className="bg-[#219653]/10 border border-[#219653]/20 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="mr-3 text-[#219653]">
                        <SettingsIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-[#219653] mb-2">Need more help?</h3>
                        <p className="text-sm text-[#219653]/80 mb-3">
                          Our support team is here to help you with any questions or issues.
                        </p>
                        <Button className="bg-[#219653] hover:bg-[#219653]/90 text-white shadow-lg">
                          Contact Support
                        </Button>
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

export default Settings;
