import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserSettings } from "@/components/settings/UserSettings";
import { PartnerSettings } from "@/components/settings/PartnerSettings";

const Settings = () => {
  const [activeView, setActiveView] = useState<'user' | 'partner'>('user');
  const isPartner = true; // TODO: Replace with actual auth check

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
        {isPartner && (
          <div className="space-x-4">
            <Button
              variant={activeView === 'user' ? 'default' : 'outline'}
              onClick={() => setActiveView('user')}
            >
              User Settings
            </Button>
            <Button
              variant={activeView === 'partner' ? 'default' : 'outline'}
              onClick={() => setActiveView('partner')}
            >
              Partner Settings
            </Button>
          </div>
        )}
      </div>

      {activeView === 'user' ? <UserSettings /> : <PartnerSettings />}
    </div>
  );
};

export default Settings;