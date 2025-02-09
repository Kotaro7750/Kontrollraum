import { Box, Button, Card, Alert, Snackbar, CardContent, Typography, CardActions, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import useConfig from "../useConfig"
import StatusMessage from "./StatusMessage";

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
  const pushManager = serviceWorker?.pushManager;

  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorOcurred, setErrorOcurred] = useState<Error | null>(null);

  const checkSubscription = () => {
    if (!serviceWorker || !pushManager) {
      return;
    }

    pushManager.getSubscription().then((subscription) => {
      setSubscription(subscription);
    });
  }

  useEffect(() => {
    checkSubscription();
  }, [serviceWorker])

  const subscribeUser = (pushManager: PushManager) => {
    setIsProcessing(true);

    let pushAppServerSubscriptionEndPoint: string;

    useConfig()
      .then(config => {
        pushAppServerSubscriptionEndPoint = config.pushAppServerSubscriptionEndPoint;

        return fetch(config.pushAppServerPublicKeyEndPoint)
      })
      .then(response => {
        if (!response.ok) {
          return Promise.reject(`Failed to fetch public key. response: ${response.text}`);
        }

        return response.text();
      })
      .then(publicKey => {
        console.log('Public Key:', publicKey);
        const applicationServerKey = urlB64ToUint8Array(publicKey);

        return pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        })
      })
      .then(function(subscription) {
        console.log('User is subscribed.');
        console.log(JSON.stringify(subscription));

        return fetch(pushAppServerSubscriptionEndPoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
        });
      })
      .then((response) => {
        if (!response.ok) {
          return Promise.reject(`Failed to posting subscription. response: ${response.text}`);
        }

        return Promise.resolve();
      })
      .catch(function(error: Error) {
        setErrorOcurred(error);
        console.error('Failed to subscribe the user: ', error.message);
      }).finally(() => {
        checkSubscription();
        setIsProcessing(false);
      });
  }

  const unsubscribeUser = (_: PushManager) => {
    if (!subscription) {
      return;
    }

    setIsProcessing(true);

    useConfig()
      .then(config => {
        return fetch(config.pushAppServerSubscriptionEndPoint, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
        })
      })
      .then((response) => {
        if (response.ok || response.status === 404) {
          const currentSubscription = subscription;
          // Ideally, clearing subscription should be done after PushSubscription.unsubscribe() is succeess.
          // But, unsubscribe() may fail and in such case, subscription in application server is deleted but subscription in push service is not deleted.
          // In such case, we clear subscription here because aborting is not possible.
          setSubscription(null);
          return Promise.resolve(currentSubscription);
        } else {
          return Promise.reject('Failed to unsubscribe the user');
        }
      })
      .then((subscription) => {
        return subscription.unsubscribe()
      })
      .then(() => {
        console.log('User is unsubscribed.');
      })
      .catch((error: Error) => {
        setErrorOcurred(error);
        console.error('Failed to unsubscribe the user: ', error.message);
      }).finally(() => {
        checkSubscription();
        setIsProcessing(false);
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
          <StatusMessage status={pushManager ? 'success' : 'error'} message="Push API Availability" />
          <StatusMessage status={subscription ? 'success' : 'error'} message="Push Notification Subscription" />
        </CardContent>

        <CardActions>
          {
            pushManager ?
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" disabled={(subscription !== null) || isProcessing} onClick={() => { subscribeUser(pushManager) }}>
                  Subscribe
                </Button>
                <Button size="small" variant="contained" color="error" disabled={subscription === null || isProcessing} onClick={() => { unsubscribeUser(pushManager) }}>
                  Unsubscribe
                </Button>
              </Stack>
              : null
          }
        </CardActions>
      </Card>
      <Snackbar open={errorOcurred !== null} autoHideDuration={3000} onClose={() => setErrorOcurred(null)}>
        <Alert onClose={() => setErrorOcurred(null)} severity="error">
          {errorOcurred?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
