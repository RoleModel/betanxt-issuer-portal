'use client'

import { BNLogo } from '@rolemodel/betanxt-design-system/components/BNLogo'
import { getSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid username or password')
      } else {
        // Check if sign in was successful
        const session = await getSession()
        if (session) {
          // Let the app handle dynamic client routing
          router.push('/')
        }
      }
    } catch (err) {
      setError('An error occurred during login')
    } finally {
      setIsLoading(false)
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
              <Button type="submit" variant="contained" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </CardActions>
          </form>
        </Card>
      </Box>
    </Container>
  )
}

export default LoginPage
