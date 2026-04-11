import { resetAddressStore, syncAddressesFromRemote } from './addressStore';
import { resetBookingStore, syncBookingsFromRemote } from './bookingStore';
import { resetProfileStore, syncProfileFromRemote } from './profileStore';
import { syncServiceCatalog } from './serviceStore';

export const syncAuthenticatedAppData = async () => {
  const results = await Promise.allSettled([
    syncProfileFromRemote(),
    syncAddressesFromRemote(),
    syncServiceCatalog(),
    syncBookingsFromRemote(),
  ]);

  const firstFailure = results.find(
    (result) => result.status === 'fulfilled' && result.value?.error,
  );

  return {
    results,
    error: firstFailure?.value?.error || null,
  };
};

export const resetAuthenticatedAppData = async () => {
  await Promise.allSettled([
    resetProfileStore(),
    resetAddressStore(),
    resetBookingStore(),
  ]);
};
