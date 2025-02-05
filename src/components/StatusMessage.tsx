import { Box, Stack, Typography } from "@mui/material";
import { CheckCircleOutline, InfoOutlined } from '@mui/icons-material';

type Props = {
  status: 'success' | 'error';
  message: string;
}

export default function StatusMessage(props: Props) {
  let statusIcon;

  switch (props.status) {
    case 'success':
      statusIcon = <CheckCircleOutline color="success" />
      break;

    case 'error':
      statusIcon = <InfoOutlined color="error" />
      break;
  }

  return (
    <Box>
      <Stack direction="row" spacing={1}>
        {statusIcon}
        <Typography>
          {props.message}
        </Typography>
      </Stack>
    </Box>
  )
}
