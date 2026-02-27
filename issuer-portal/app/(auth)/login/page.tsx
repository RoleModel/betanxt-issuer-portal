'use client'

import { BNLogo } from '@rolemodel/betanxt-design-system/components/BNLogo'
import { useState } from 'react'

import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Container,
  TextField,
  Typography,
} from '@mui/material'

import { authenticate } from './actions'

export const dynamic = 'force-dynamic'

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsPending(true)

    try {
      const result = await authenticate(username, password)
      if (result && 'error' in result) {
        setError(result.error)
      } else if (result && 'success' in result) {
        // Force a full page reload so all client-side caches (session, SWR, router)
        // are reinitialized with the new session cookie instead of stale state.
        window.location.href = '/'
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardMedia
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              mt: 2,
            }}
          >
            <BNLogo height={36} />
          </CardMedia>

          <form onSubmit={handleSubmit}>
            <Typography
              variant="body1"
              color="text.secondary"
              align="center"
              sx={{ mb: 3 }}
            >
              Welcome to the BetaNXT Issuer Portal
            </Typography>
            <CardContent>
              <TextField
                id="login-username"
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="dense"
                required
                autoFocus
              />
              <TextField
                id="login-password"
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="dense"
                required
              />
            </CardContent>
            {error && (
              <CardContent>
                <Alert severity="error">{error}</Alert>
              </CardContent>
            )}
            <CardActions>
              <Button type="submit" variant="contained" disabled={isPending}>
                {isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </CardActions>
          </form>
        </Card>
      </Box>
    </Container>
  )
}

export default LoginPage
