/** Ambient types for the slice of LG's webOSTV.js library this app uses. */
interface WebOSServiceRequestParams {
  method: string;
  parameters?: Record<string, unknown>;
  onSuccess?: (response: Record<string, unknown>) => void;
  onFailure?: (error: { errorCode?: number; errorText?: string }) => void;
}

interface WebOSTV {
  service: {
    request(uri: string, params: WebOSServiceRequestParams): void;
  };
}

interface Window {
  webOS?: WebOSTV;
}
