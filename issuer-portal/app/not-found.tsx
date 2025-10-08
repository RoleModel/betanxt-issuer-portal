import React from 'react'

import { Container, Typography } from '@mui/material'

import BNLink from '@/components/BNLink'

export default function NotFound() {
  return (
    <Container
      maxWidth="md"
      sx={{
        p: 3,
        position: 'relative',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography
        variant="pageTitle"
        data-error="404"
        sx={{
          fontSize: '76px',
          '&:before': {
            color: 'rgba(var(--mui-palette-primary-mainChannel) / 0.2)', // Using default primary color with opacity
            content: 'attr(data-error)',
            fontSize: '40vw',
            fontWeight: 700,
            textAlign: 'center',
            left: '50%',
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            zIndex: 0,
          },
        }}
      >
        404
      </Typography>
      <Typography variant="pageTitle">Sorry, we can&apos;t find that page.</Typography>
      <BNLink href="/" sx={{ zIndex: 1 }}>
        Return Home
      </BNLink>
    </Container>
  )
}
