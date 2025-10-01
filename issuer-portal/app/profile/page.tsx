import {
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  Grid,
  TextField,
} from '@mui/material'

const ProfilePage = () => {
  return (
    <Container className="profile-container" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
      <Card>
        <CardHeader
          title="User Information"
          avatar={<Avatar alt="User Avatar" src="/path/to/avatar.jpg" />}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ sm: 12, md: 6 }}>
              <TextField
                label="Name"
                defaultValue="John Smith"
                fullWidth
                type="text"
                margin="normal"
              />
            </Grid>
            <Grid size={{ sm: 12, md: 6 }}>
              <TextField
                label="Last Name"
                defaultValue="Doe"
                fullWidth
                type="text"
                margin="normal"
              />
            </Grid>
            <Grid size={{ sm: 12, md: 6 }}>
              <TextField
                label="Email"
                defaultValue=""
                fullWidth
                autoComplete="email"
                type="email"
                margin="normal"
              />
            </Grid>
            <Grid size={{ sm: 12, md: 6 }}>
              <TextField
                label="Password"
                defaultValue="********"
                fullWidth
                type="password"
                autoComplete="current-password"
                margin="normal"
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button variant="contained" color="primary">
            Save Changes
          </Button>
        </CardActions>
      </Card>
    </Container>
  )
}

export default ProfilePage
