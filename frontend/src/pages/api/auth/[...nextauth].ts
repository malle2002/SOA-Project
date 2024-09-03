import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { gql } from '@apollo/client';
import client from '@/lib/apollo-client';

const secret = process.env.NEXTAUTH_SECRET as string;

interface RedirectProps {
  url: string;
  baseUrl: string;
}

declare module "next-auth" {
  interface Session {
    id: string;
    username: string;
    email: string;
    accessToken: string;
  }
}
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: {
          label: 'Username:',
          type: 'text',
          placeholder: 'your username',
        },
        password: {
          label: 'Password:',
          type: 'password',
        },
      },
      async authorize(credentials) {
        const { username, password } = credentials || { username: null, password: null };
        try {
          const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });

          if (response.ok) {
            const data = await response.json();
            const { token, id, username, email } = data;

            if (id) {
              return {
                id: id,
                username: username,
                email: email,
                token,
              };
            } else return null;
          } else {
            return null;
          }
        } catch (error) {
          console.error('Login error:', error);
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      profile(profile) {
        const username = profile.email.split('@')[0];
        return {
          id: profile.sub,
          email: profile.email,
          username,
        };
      },
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login'
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      return true;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.id = token.id;
        session.username = token.username;
        session.email = token.email;
        session.accessToken = token.accessToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  secret,
  session: {
    strategy: 'jwt',
  },
  jwt: {
    secret,
    maxAge: 60 * 60 * 24 * 7
  }
}

export default async function auth(req: any, res: any) {
  return NextAuth(req, res, authOptions);
}