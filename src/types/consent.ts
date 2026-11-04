export type ConsentStatus = 'loading' | 'unset' | 'granted' | 'denied';

export type TrackingConsent = {
  status: Exclude<ConsentStatus, 'loading'>;
  updatedAt: string | null;
};
