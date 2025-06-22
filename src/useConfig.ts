type Config = {
  pushAppServerPublicKeyEndPoint: string;
  pushAppServerSubscriptionEndPoint: string;
  rakutenSecurityAuthStatusEndPoint: string;
  rakutenSecurityAuthEndPoint: string;
}

export default function useConfig(): Promise<Config> {
  let promise: Promise<Config>;

  switch (import.meta.env.VITE_APP_CONFIG_LOAD_MODE) {
    case "ENV":
      promise = Promise.resolve({
        pushAppServerPublicKeyEndPoint: import.meta.env.VITE_APP_SERVER_PUBLIC_KEY_ENDPOINT || "",
        pushAppServerSubscriptionEndPoint: import.meta.env.VITE_APP_SERVER_POST_SUBSCRIPTION_ENDPOINT || "",
        rakutenSecurityAuthStatusEndPoint: import.meta.env.VITE_RAKUTEN_SECURITY_AUTH_STATUS_ENDPOINT || "",
        rakutenSecurityAuthEndPoint: import.meta.env.VITE_RAKUTEN_SECURITY_AUTH_ENDPOINT || ""
      })
      break;

    case "REMOTE_FILE":
      promise = fetch("/config.json")
        .then((response) => response.json())
        .then((json) => {
          return {
            pushAppServerPublicKeyEndPoint: json.pushAppServerPublicKeyEndPoint,
            pushAppServerSubscriptionEndPoint: json.pushAppServerSubscriptionEndPoint,
            rakutenSecurityAuthStatusEndPoint: json.rakutenSecurityAuthStatusEndPoint || "",
            rakutenSecurityAuthEndPoint: json.rakutenSecurityAuthEndPoint || ""
          };
        });
      break;
    default:
      promise = Promise.reject(new Error("Invalid config load mode. mode: " + import.meta.env.VITE_APP_CONFIG_LOAD_MODE));
  }

  return promise;
}
