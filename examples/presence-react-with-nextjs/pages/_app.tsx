import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Provider } from '../../../packages/presence-react/dist/index'
import React from 'react';
import "/Users/luzhenqian/Work/xile/presencejs/packages/dev-tools/dist/index.js"

function MyApp({ Component, pageProps }: AppProps) {
  return <Provider host="https://prsc.yomo.dev" auth={{type:'publickey', publicKey:'BYePWMVCfkWRarcDLBIbSFzrMkDldWIBuKsA' }} type="WebSocket"><Component {...pageProps} /></Provider>
  // return <Provider host="https://prsc.yomo.dev" auth={{type:'token', endpoint:'/api/presence-auth'}} type="WebSocket"><Component {...pageProps} /></Provider>
}

export default MyApp
