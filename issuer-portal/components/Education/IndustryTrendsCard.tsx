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
  readonly title?: string;
  readonly date?: string;
  readonly duration?: string;
  readonly content?: string;
  readonly actionText?: string;
  readonly actions?: React.ReactNode;
  readonly url?: string;
  readonly img?: string;
  readonly externalLink?: boolean;
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
      <CardHeader title={title} />
      <CardContent>
        <Box mb={1}>
          <Typography variant="caption" color="text.secondary">
            {date}
          </Typography>
          {duration ? (
            <Typography gutterBottom variant="caption" color="text.secondary">
              Duration:{duration}
            </Typography>
          ) : null}
        </Box>
        {content}
      </CardContent>
      {url ? (
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
      ) : null}
    </Card>
  );
};
