import { useRouter } from 'next/navigation'

import { Card, CardActionArea, CardContent, Paper, Typography } from '@mui/material'

interface PreviewLinksCardProps {
  url1?: string | null
  url2?: string | null
}

export default function PreviewLinksCard({ url1, url2 }: PreviewLinksCardProps) {
  url1 = 'https://dsm.preview.url'
  url2 = 'https://dsm.preview.url'
  const router = useRouter()
  return (
    <Card>
      <CardContent
        sx={{
          display: 'flex',
          gap: 2,
          p: 2,
          '&:last-child': {
            p: 2,
          },
        }}
      >
        <Paper variant="outlined" sx={{ flex: 1 }}>
          <CardActionArea
            onClick={() => {
              if (url1) router.push(url1)
            }}
          >
            <CardContent>
              <Typography variant="h5">Meeting Presenter Preview Link</Typography>
              <Typography variant="body3" color="link" fontWeight={500}>
                {url1}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1 }}>
          <CardActionArea
            onClick={() => {
              if (url2) router.push(url2)
            }}
          >
            <CardContent>
              <Typography variant="h5">Meeting Audience Preview Link</Typography>
              <Typography variant="body3" color="link" fontWeight={500}>
                {url2}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Paper>
      </CardContent>
    </Card>
  )
}
