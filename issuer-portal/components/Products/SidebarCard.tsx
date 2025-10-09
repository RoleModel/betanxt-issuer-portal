import type {
  CardProps} from '@mui/material';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from '@mui/material'

interface SidebarCardProps extends CardProps {
  title: string
  button?: boolean
  buttonText?: string
  icon?: React.ReactNode
  onClick?: () => void
}

export const SidebarCard = (props: SidebarCardProps) => {
  const { children, title, sx: sxProps, button, buttonText, onClick, icon } = props
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
            fontFamily="var(--font-tungsten)"
            component="h3"
            sx={{ color: (theme) => theme.vars.palette.primary.main }}
          >
            {title}
          </Typography>
        }
      />
      <CardContent
        sx={{
          pt: 0,
        }}
      >
        {children}
        {button && (
          <Button
            variant="outlined"
            color="primary"
            sx={{ mt: 2 }}
            onClick={onClick}
            startIcon={icon ? icon : null}
          >
            {buttonText}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
