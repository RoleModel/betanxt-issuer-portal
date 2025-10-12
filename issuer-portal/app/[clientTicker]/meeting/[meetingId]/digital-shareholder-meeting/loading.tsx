import { Container, Skeleton, Stack } from '@mui/material'

export default function Loading() {
  return (
    <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
      <Stack direction="column" spacing={2}>
        {/* Skeleton for DSMParticipants */}
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />

        {/* Skeleton for DSMGuestRegistrants */}
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
      </Stack>
    </Container>
  )
}
