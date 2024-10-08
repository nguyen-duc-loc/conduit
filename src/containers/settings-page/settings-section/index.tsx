'use client';

import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

import { TabName } from '..';
import ProfileSettingsSection from '../profile-settings-section';
import AccountSettingsSection from '../account-settings-section';
import { Separator } from '@/components/Separator';
import { capitalize } from 'lodash';
import { Profile } from '@/types/Profile';

const AppearanceSettings = dynamic(() => import('../appearance-settings-section'), {
  ssr: false
});

export default function SettingsSection({
  className,
  currentUser
}: {
  className: string;
  currentUser: Profile | null;
}) {
  const mappingTab: {
    [key in TabName]: {
      description: string;
      Component: React.ReactNode;
    };
  } = {
    profile: {
      description: 'This is how others will see you on the site.',
      Component: <ProfileSettingsSection currentUser={currentUser} />
    },
    account: {
      description: 'Update your account settings. Set your password.',
      Component: <AccountSettingsSection currentUser={currentUser} />
    },
    appearance: {
      description:
        'Customize the appearance of the app. Automatically switch between day and night themes.',
      Component: <AppearanceSettings />
    }
  };

  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabName) ?? 'profile';
  const currentTab = mappingTab[activeTab];

  return (
    <div className={className}>
      <div>
        <h3 className="text-lg font-medium">{capitalize(activeTab)}</h3>
        <p className="text-sm text-muted-foreground">{currentTab.description}</p>
      </div>
      <Separator className="w-11/12" />
      {currentTab.Component}
    </div>
  );
}
