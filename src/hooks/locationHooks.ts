import { useContext, useEffect, useState } from 'react';
import * as Location from 'expo-location';

import { SettingsContext } from '../SettingsProvider';
import { storageHelper } from '../helpers';
import { LocationSettings } from '../types';

const requestAndFetchPosition = async (
  setAndSyncLocationSettings: (arg: LocationSettings) => Promise<void>
) => {
  const { status } = await Location.requestForegroundPermissionsAsync();

  await setAndSyncLocationSettings({ sortPOIs: status === Location.PermissionStatus.GRANTED });

  if (status === Location.PermissionStatus.GRANTED) {
    return await Location.getCurrentPositionAsync({});
  }
};

export const useLocationSettings = () => {
  // @ts-expect-error settings are not properly typed
  const { locationSettings, setLocationSettings } = useContext(SettingsContext);

  const setAndSyncLocationSettings = async (newSettings: LocationSettings) => {
    setLocationSettings(newSettings);
    await storageHelper.setLocationSettings(newSettings);
  };

  return {
    locationSettings: locationSettings as LocationSettings,
    setAndSyncLocationSettings
  };
};

export const usePosition = (skip?: boolean) => {
  const { locationSettings, setAndSyncLocationSettings } = useLocationSettings();
  const [position, setPosition] = useState<Location.LocationObject>();
  const [loading, setLoading] = useState(false);

  const shouldGetPosition = !skip && locationSettings.sortPOIs;

  useEffect(() => {
    let mounted = true;
    if (shouldGetPosition) {
      setLoading(true);
      requestAndFetchPosition(setAndSyncLocationSettings)
        .then((result) => {
          if (mounted && result) {
            setPosition(result);
          }
        })
        .finally(() => setLoading(false));
    }
    return () => {
      mounted = false;
    };
  }, [shouldGetPosition]);

  // actively return undefined as the position, to avoid using the position from when the in app setting was true
  return { loading, position: shouldGetPosition ? position : undefined };
};