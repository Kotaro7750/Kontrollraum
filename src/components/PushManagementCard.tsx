import { Box, Button, Card, Alert, Snackbar, CardContent, Typography, CardActions } from "@mui/material";
import { useEffect, useState } from "react";
import StatusMessage from "./StatusMessage";

const applicationServerPublicKeyEndpoint = import.meta.env.VITE_APP_SERVER_PUBLIC_KEY_ENDPOINT || "";
const applicationServerSubscriptionEndpoint = import.meta.env.VITE_APP_SERVER_POST_SUBSCRIPTION_ENDPOINT || "";

const urlB64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type Props = {
  serviceWorker: ServiceWorkerRegistration | null;
};
export default function PushManagementCard(props: Props) {
  const serviceWorker = props.serviceWorker;
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showError, setShowError] = useState(false);

  const checkSubscription = () => {
    if (!serviceWorker) {
      return;
    }

    serviceWorker.pushManager.getSubscription().then((subscription) => {
      setIsSubscribed(!(subscription === null));
    });
  }

  useEffect(() => {
    checkSubscription();
  }, [serviceWorker])

  const subscribeUser = (serviceWorker: ServiceWorkerRegistration) => {
    setIsSubscribing(true);

    fetch(applicationServerPublicKeyEndpoint)
      .then(response => response.text())
      .then(publicKey => {
        console.log('Public Key:', publicKey);
        const applicationServerKey = urlB64ToUint8Array(publicKey);

        return serviceWorker.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        })
      })
      .then(function(subscription) {
        console.log('User is subscribed.');
        console.log(JSON.stringify(subscription));

        return fetch(applicationServerSubscriptionEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
        });
      })
      .catch(function(error) {
        setShowError(true);
        console.error('Failed to subscribe the user: ', error);
      }).finally(() => {
        checkSubscription();
        setIsSubscribing(false);
      });
  }


  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" component="div">
            Push Notification
          </Typography>

          <StatusMessage status={serviceWorker ? 'success' : 'error'} message="ServiceWorker Registration" />
          <StatusMessage status={isSubscribed ? 'success' : 'error'} message="Push Notification Subscription" />
        </CardContent>

        <CardActions>
          {
            serviceWorker ?
              <Button size="small" variant="contained" disabled={isSubscribed || isSubscribing} onClick={() => { subscribeUser(serviceWorker) }}>
                Enable Push Messaging
              </Button>
              : null
          }
        </CardActions>
      </Card>
      <Snackbar open={showError} autoHideDuration={3000} onClose={() => setShowError(false)}>
        <Alert onClose={() => setShowError(false)} severity="error">
          Cannot subscribe to push notifications
        </Alert>
      </Snackbar>
    </Box>
  );
}
