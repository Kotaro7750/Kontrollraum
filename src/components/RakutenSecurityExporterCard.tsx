import { Box, Card, Alert, Snackbar, CardContent, Typography, Button, CardActions, IconButton, CircularProgress } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { useEffect, useState } from "react";
import useConfig from "../useConfig";
import StatusMessage from "./StatusMessage";

export default function RakutenSecurityExporterCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorOccurred, setErrorOccurred] = useState<Error | null>(null);
  const [tokenValidity, setTokenValidity] = useState<boolean | null>(null);

  const fetchApiData = async () => {
    setIsLoading(true);
    setErrorOccurred(null);

    try {
      const config = await useConfig();
      const response = await fetch(config.rakutenSecurityAuthStatusEndPoint);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      const data = await response.json();

      // token_validityフィールドのみを抽出
      if ('token_validity' in data && typeof data.token_validity === 'boolean') {
        setTokenValidity(data.token_validity);
      } else {
        setTokenValidity(null);
      }
    } catch (error) {
      setErrorOccurred(error as Error);
      setTokenValidity(null);
      console.error('Failed to fetch API data: ', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    setIsLoading(true);
    setErrorOccurred(null);

    try {
      const config = await useConfig();
      const response = await fetch(config.rakutenSecurityAuthEndPoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();

      // レスポンスJSONからURLフィールドを抽出 (例: auth_url, redirect_url など)
      if ('auth_url' in data && typeof data.auth_url === 'string') {
        window.open(data.auth_url, '_blank');
      } else {
        throw new Error('No valid URL found in response');
      }
    } catch (error) {
      setErrorOccurred(error as Error);
      console.error('Failed to refresh token: ', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiData();
  }, []);

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="div">
              Rakuten Security Exporter
            </Typography>
            <IconButton
              onClick={fetchApiData}
              disabled={isLoading}
              size="small"
            >
              <Refresh />
            </IconButton>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              <StatusMessage
                status={tokenValidity === null ? 'error' : 'success'}
                message="Auth API Status"
              />
              <StatusMessage
                status={tokenValidity ? 'success' : 'error'}
                message="Gmail API OAuth2 Token Validity"
              />
            </>
          )}
        </CardContent>

        <CardActions>
          <Button
            variant="contained"
            disabled={tokenValidity !== false || isLoading}
            onClick={handleRefreshToken}
          >
            Authorize Gmail API
          </Button>
        </CardActions>
      </Card>

      <Snackbar open={errorOccurred !== null} autoHideDuration={3000} onClose={() => setErrorOccurred(null)}>
        <Alert onClose={() => setErrorOccurred(null)} severity="error">
          {errorOccurred?.message}
        </Alert>
      </Snackbar>
    </Box >
  );
}

