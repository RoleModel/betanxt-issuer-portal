'use client'

import { BNLogo } from '@rolemodel/betanxt-design-system/components/BNLogo'
import { useState, useTransition } from 'react'

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
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const result = await authenticate(username, password)
      if (result?.error) {
        setError(result.error)
      }
    })
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
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="dense"
                required
                autoFocus
              />
              <TextField
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
