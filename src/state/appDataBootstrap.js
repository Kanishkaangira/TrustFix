import { resetAddressStore, syncAddressesFromRemote } from './addressStore';
import { getAuthState } from './authStore';
import { resetBookingStore, syncBookingsFromRemote } from './bookingStore';
import { resetProfileStore, syncProfileFromRemote } from './profileStore';
import { syncServiceCatalog } from './serviceStore';
import {
  resetTechnicianProfileStore,
  syncTechnicianProfileFromRemote,
} from '../technician/profileStore';

export const syncAuthenticatedAppData = async () => {
  const isTechnicianPortal = getAuthState().currentPortal === 'technician';
  const tasks = isTechnicianPortal
    ? [
        syncTechnicianProfileFromRemote(),
        syncServiceCatalog(),
      ]
    : [
        syncProfileFromRemote(),
        syncAddressesFromRemote(),
        syncServiceCatalog(),
        syncBookingsFromRemote(),
      ];

  const results = await Promise.allSettled(tasks);

  const firstFailure = results.find(
    (result) => result.status === 'fulfilled' && result.value?.error,
  );

  return {
    results,
    error: firstFailure?.value?.error || null,
  };
};

export const resetAuthenticatedAppData = async () => {
  const isTechnicianPortal = getAuthState().currentPortal === 'technician';
  const tasks = isTechnicianPortal
    ? [resetTechnicianProfileStore()]
    : [
        resetProfileStore(),
        resetAddressStore(),
        resetBookingStore(),
      ];

  await Promise.allSettled(tasks);
};
