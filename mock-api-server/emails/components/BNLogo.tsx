import { Img } from '@react-email/components'
import React from 'react'

// Base64-encoded PNG — SVGs are stripped by Gmail/Outlook so we embed a raster copy.
// Regenerate: node -e "require('sharp')(Buffer.from('<svg…/>')).png().toBuffer().then(b=>console.log('data:image/png;base64,'+b.toString('base64')))"
const LOGO_SRC =
  'https://ik.imagekit.io/dtunrco/_mSrc-hrybp1AhldJl0Fx1TWckGPufa4SLx_nw2YWHg.png'

const BNLogo = () => (
  <Img
    src={LOGO_SRC}
    width={119}
    height={28}
    alt="BetaNXT"
    style={{ display: 'block' }}
  />
)

export default BNLogo
