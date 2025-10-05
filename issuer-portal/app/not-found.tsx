import Link from 'next/link'
import React from 'react'

import { Container, Link as MuiLink, Typography } from '@mui/material'

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
            color: (theme) => `rgba(${theme.vars.palette.primary.mainChannel} / 0.2)`,
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
      <MuiLink component={Link} href="/" sx={{ zIndex: 1 }}>
        Return Home
      </MuiLink>
    </Container>
  )
}
