import type { AppProps } from 'next/app';
import '@/index.css';
import App from '@/App';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <App>
      <Component {...pageProps} />
    </App>
  );
}


