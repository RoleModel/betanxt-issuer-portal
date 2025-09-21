import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardProps,
  Typography,
} from '@mui/material'

interface SidebarCardProps extends CardProps {
  title: string
  button?: boolean
  buttonText?: string
  onClick?: () => void
}

export const SidebarCard = (props: SidebarCardProps) => {
  const { children, title, sx: sxProps, button, buttonText, onClick } = props
  return (
    <Card
      sx={{
        ...sxProps,
        height: 'fit-content',
        backgroundColor: (theme) => theme.vars.palette.aquaLight,
      }}
    >
      <CardHeader
        title={
          <Typography
            variant="pageTitle"
            component="h3"
            sx={{ color: (theme) => theme.vars.palette.primary.main }}
          >
            {title}
          </Typography>
        }
      />
      <CardContent>
        {children}
        {button && (
          <Button variant="outlined" color="primary" sx={{ mt: 2 }} onClick={onClick}>
            {buttonText}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
