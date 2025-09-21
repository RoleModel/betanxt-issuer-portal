import { useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  useTheme,
} from '@mui/material'
import TextareaAutosize from '@mui/material/TextareaAutosize'

interface ContactFormData {
  name: string
  email: string
  message: string
}

export function CTACard() {
  const theme = useTheme()
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  })

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Contact form submitted:', contactForm)
  }

  return (
    <Card
      id="contact"
      sx={{
        backgroundColor: theme.vars.palette.aquaLight,
      }}
    >
      <CardHeader
        title={
          <Typography color="primary" variant="h1" component="p">
            Let&apos;s Talk
          </Typography>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body3">
              Connect with one of our specialists to learn more about our expertise for
              proxies, shareholder processes, and the shareholder experience. Send us a
              message and we&apos;ll respond to your proxy advisory inquiry right away.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              component="form"
              onSubmit={handleContactSubmit}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'end',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  '& textarea': {
                    padding: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    width: '100%',
                  },
                }}
              >
                <TextareaAutosize
                  className="textarea-autosize"
                  placeholder="How can we help you this proxy season?"
                  minRows={3}
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                  required
                />
              </Box>
              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{ alignSelf: 'flex-start' }}
              >
                Submit
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

// Export types for external use
export type { ContactFormData }

// Also export as default for backward compatibility
export default CTACard
