import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useTheme } from 'next-themes';

// Type definitions
interface AccountSettings {
  investmentLimit: number;
  matchRate: number;
}

interface NotificationSettings {
  email: boolean;
  investmentAlerts: boolean;
  matchAlerts: boolean;
}

interface ComplianceSettings {
  kycVerified: boolean;
  kycPending: boolean;
  twoFactorAuth: boolean;
  lastVerified?: string;
}

export const PartnerSettings = () => {
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  // State management
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    investmentLimit: 1000,
    matchRate: 10,
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    investmentAlerts: true,
    matchAlerts: true,
  });

  const [compliance, setCompliance] = useState<ComplianceSettings>({
    kycVerified: false,
    kycPending: false,
    twoFactorAuth: false,
  });

  // Load saved settings
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('partnerSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setAccountSettings(parsed.account || {
            investmentLimit: 1000,
            matchRate: 10,
          });
          setNotifications(parsed.notifications || {
            email: true,
            investmentAlerts: true,
            matchAlerts: true,
          });
          setCompliance(parsed.compliance || {
            kycVerified: false,
            kycPending: false,
            twoFactorAuth: false,
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Validation logic
  const validateSettings = (): string[] => {
    const errors = [];
    
    if (accountSettings.investmentLimit < 100) {
      errors.push('Minimum investment limit is 100 DAI');
    }
    
    if (accountSettings.matchRate < 0 || accountSettings.matchRate > 100) {
      errors.push('Match rate must be between 0% and 100%');
    }

    if (!compliance.kycVerified && accountSettings.investmentLimit > 5000) {
      errors.push('KYC verification required for investments over 5000 DAI');
    }

    return errors;
  };

  // Save handler
  const handleSave = (section: string) => {
    const validationErrors = validateSettings();
    
    if (validationErrors.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: validationErrors.join('\n'),
      });
      return;
    }

    try {
      localStorage.setItem('partnerSettings', JSON.stringify({
        account: accountSettings,
        notifications,
        compliance
      }));

      toast({
        title: `${section} Updated`,
        description: `Your ${section.toLowerCase()} have been successfully saved.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Failed to save settings. Please try again.',
      });
    }
  };

  // KYC Verification handler
  const handleKYCVerification = async () => {
    try {
      setCompliance(prev => ({ ...prev, kycPending: true }));
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCompliance(prev => ({
        ...prev,
        kycVerified: true,
        kycPending: false,
        lastVerified: new Date().toISOString()
      }));
      toast({
        title: "KYC Verified",
        description: "Your identity verification was successful",
      });
    } catch (error) {
      setCompliance(prev => ({ ...prev, kycPending: false }));
      toast({
        variant: 'destructive',
        title: 'KYC Verification Failed',
        description: 'Failed to verify identity. Please try again.',
      });
    }
  };

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50'
    }`}>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className={`flex justify-between items-center pb-6 border-b ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div>
            <h1 className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Partner Settings
            </h1>
          </div>
        </div>

        {/* Compliance Settings */}
        <Card className={`backdrop-blur-lg ${
          isDarkMode 
            ? 'bg-slate-800/40 border-white/10' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <CardHeader>
            <CardTitle className={`text-lg flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Compliance Settings
              {compliance.kycVerified ? (
                <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20">
                  Verified
                </Badge>
              ) : (
                <Badge className="bg-red-400/10 text-red-400 border-red-400/20">
                  Unverified
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>
                  KYC Verification
                </Label>
                <p className={`text-sm ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  {compliance.kycVerified 
                    ? `Last verified: ${new Date(compliance.lastVerified!).toLocaleDateString()}`
                    : "Required for large investments"}
                </p>
              </div>
              <Button
                onClick={handleKYCVerification}
                disabled={compliance.kycPending || compliance.kycVerified}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {compliance.kycPending 
                  ? "Verifying..."
                  : compliance.kycVerified 
                    ? "Verified ✓"
                    : "Start Verification"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>
                  Two-Factor Authentication (2FA)
                </Label>
                <p className={`text-sm ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  Add an extra layer of security
                </p>
              </div>
              <Switch
                checked={compliance.twoFactorAuth}
                onCheckedChange={(checked) => 
                  setCompliance(prev => ({ ...prev, twoFactorAuth: checked }))
                }
              />
            </div>

            <Button
              onClick={() => handleSave("Compliance Settings")}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              Save Compliance Settings
            </Button>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className={`backdrop-blur-lg ${
          isDarkMode 
            ? 'bg-slate-800/40 border-white/10' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <CardHeader>
            <CardTitle className={`text-lg ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>
                Investment Limit (DAI)
              </Label>
              <Input
                type="number"
                value={accountSettings.investmentLimit}
                onChange={(e) => setAccountSettings(prev => ({
                  ...prev,
                  investmentLimit: Number(e.target.value)
                }))}
                className={`w-full ${
                  isDarkMode 
                    ? 'bg-slate-700/50 border-white/10 text-white' 
                    : 'bg-white border-gray-200'
                }`}
              />
            </div>

            <div className="space-y-2">
              <Label className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>
                Match Rate (%)
              </Label>
              <Input
                type="number"
                value={accountSettings.matchRate}
                onChange={(e) => setAccountSettings(prev => ({
                  ...prev,
                  matchRate: Number(e.target.value)
                }))}
                className={`w-full ${
                  isDarkMode 
                    ? 'bg-slate-700/50 border-white/10 text-white' 
                    : 'bg-white border-gray-200'
                }`}
              />
            </div>

            <Button
              onClick={() => handleSave("Account Settings")}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              Save Account Settings
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className={`backdrop-blur-lg ${
          isDarkMode 
            ? 'bg-slate-800/40 border-white/10' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <CardHeader>
            <CardTitle className={`text-lg ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                id: 'email',
                title: 'Email Notifications',
                description: 'Receive updates via email'
              },
              {
                id: 'investmentAlerts',
                title: 'Investment Alerts',
                description: 'Get notified about new investment opportunities'
              },
              {
                id: 'matchAlerts',
                title: 'Match Alerts',
                description: 'Updates about matching opportunities'
              }
            ].map(({ id, title, description }) => (
              <div key={id} className="flex items-center justify-between">
                <div>
                  <Label className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>
                    {title}
                  </Label>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    {description}
                  </p>
                </div>
                <Switch
                  checked={notifications[id as keyof NotificationSettings]}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, [id]: checked }))
                  }
                />
              </div>
            ))}

            <Button
              onClick={() => handleSave("Notification Settings")}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              Save Notification Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerSettings;