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

const AutoAreasizeStyles = {
  padding: '8px',
  width: '100%',
  border: '1px solid',
  backgroundColor: 'var(--mui-palette-inputOutlinedEnabledFill)',
  borderColor: 'var(--mui-palette-primary-main)',
  borderRadius: '4px',
  fontSize: '1rem',
  lineHeight: 1.3,
  fontFamily: 'var(--font-roboto)',
  '&:focus': {
    outline: 'var(--mui-palette-primary-main)',
  },
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
          <Typography
            color="primary"
            variant="h1"
            component="p"
            fontFamily={'var(--font-tungsten)'}
          >
            Let&apos;s Talk
          </Typography>
        }
      />
      <CardContent>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="body1">
              Connect with one of our specialists to learn more about our expertise for
              proxies, shareholder processes, and the shareholder experience. Send us a
              message and we&apos;ll respond to your proxy advisory inquiry right away.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              component="form"
              onSubmit={handleContactSubmit}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'end',
                gap: 1,
              }}
            >
              <TextareaAutosize
                name="Contact Message"
                id="contact-message"
                style={AutoAreasizeStyles}
                placeholder="How can we help you this proxy season?"
                minRows={5}
                value={contactForm.message}
                onChange={(e) =>
                  setContactForm({ ...contactForm, message: e.target.value })
                }
                required
              />
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
