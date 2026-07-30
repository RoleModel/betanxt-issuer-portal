import { OpenInNewOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Typography,
} from "@mui/material";

interface IndustryTrendsCardProps {
  title?: string;
  date?: string;
  duration?: string;
  content?: string;
  actionText?: string;
  actions?: React.ReactNode;
  url?: string;
  img?: string;
  externalLink?: boolean;
}

export const IndustryTrendsCard = ({
  title,
  content,
  date,
  duration,
  url,
  actionText = "View",
  img,
  externalLink,
}: IndustryTrendsCardProps) => {
  return (
    <Card>
      <CardMedia image={img} sx={{ height: 200 }} />
      <CardHeader title={title}></CardHeader>
      <CardContent>
        <Box mb={1}>
          <Typography variant="caption" color="text.secondary">
            {date}
          </Typography>
          {duration && (
            <Typography gutterBottom variant="caption" color="text.secondary">
              Duration:{duration}
            </Typography>
          )}
        </Box>
        {content}
      </CardContent>
      {url && (
        <CardActions>
          <Button
            variant="outlined"
            component="a"
            href={url}
            target="_blank"
            startIcon={externalLink ? <OpenInNewOutlined /> : undefined}
          >
            {actionText}
          </Button>
        </CardActions>
      )}
    </Card>
  );
};
