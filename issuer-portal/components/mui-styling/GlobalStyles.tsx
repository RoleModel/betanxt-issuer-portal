import GlobalStyles from '@mui/material/GlobalStyles'

const globalStyles = {
  ':root': {
    '--font-tungsten': '"Tungsten", sans-serif',
  },
  '@font-face': [
    {
      fontFamily: '"Tungsten"',
      src: 'url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-Bold.woff2) format("woff2"), url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-Bold.woff) format("woff")',
      fontWeight: 'bold',
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
    {
      fontFamily: '"Tungsten"',
      src: 'url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-Black.woff2) format("woff2"), url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-Black.woff) format("woff")',
      fontWeight: 900,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
    {
      fontFamily: '"Tungsten Book"',
      src: 'url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-Book.woff2) format("woff2"), url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-Book.woff) format("woff")',
      fontWeight: 'normal',
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
    {
      fontFamily: '"Tungsten"',
      src: 'url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-Light.woff2) format("woff2"), url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-Light.woff) format("woff")',
      fontWeight: 300,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
    {
      fontFamily: '"Tungsten"',
      src: 'url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-Thin.woff2) format("woff2"), url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-Thin.woff) format("woff")',
      fontWeight: 100,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
    {
      fontFamily: '"Tungsten Extra"',
      src: 'url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-ExtraLight.woff2) format("woff2"), url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-ExtraLight.woff) format("woff")',
      fontWeight: 200,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
    {
      fontFamily: '"Tungsten"',
      src: 'url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-Medium.woff2) format("woff2"), url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-Medium.woff) format("woff")',
      fontWeight: 500,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
    {
      fontFamily: '"Tungsten"',
      src: 'url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-Semibold.woff2) format("woff2"), url(https://22382417.fs1.hubspotusercontent-na1.net/hubfs/22382417/webfonts/Tungsten-Semibold.woff) format("woff")',
      fontWeight: 600,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
  ],
}

const GlobalStyle = () => <GlobalStyles styles={globalStyles} />

export default GlobalStyle
