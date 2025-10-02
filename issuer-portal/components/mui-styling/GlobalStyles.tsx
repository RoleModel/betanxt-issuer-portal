import GlobalStyles from '@mui/material/GlobalStyles'

const globalStyles = {
  ':root': {
    '& .MuiPaper-root.MuiDrawer-paperAnchorRight': {
      top: '104px !important'
    }
  },
}

const GlobalStyle = () => <GlobalStyles styles={globalStyles} />

export default GlobalStyle
