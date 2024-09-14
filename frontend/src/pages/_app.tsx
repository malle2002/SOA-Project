import React from 'react';
import { AppProps } from 'next/app';
import { ApolloProvider } from '@apollo/client';
import client from "../lib/apollo-client"
//import { Inter } from 'next/font/google'
import Layout from '../components/layout'
import "../app/globals.css"
import { SessionProvider } from 'next-auth/react';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

//const inter = Inter({ subsets: ['latin'] })

function MyApp({ Component, pageProps }: AppProps) {

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    throw new Error("PAYPAL_CLIENT_ID is not set in the environment variables.");
  }
  // ${inter.className} + 
  return (
    
    <main className="bg:white dark:bg-black">
      <React.StrictMode>
        <SessionProvider>
          <ApolloProvider client={client}>
            <PayPalScriptProvider options={{ "clientId": clientId, currency: "USD" }}>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </PayPalScriptProvider>
          </ApolloProvider>
        </SessionProvider>
      </React.StrictMode>
      
    </main>
  );
}
export default MyApp;
