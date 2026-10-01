"use client";

import * as React from "react";
import { ApolloProvider as ApolloProviderBase } from "@apollo/client";
import type { ApolloClient } from "@apollo/client";
import { createApolloClient } from "./client";

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState<ApolloClient<unknown> | null>(() =>
    createApolloClient()
  );

  if (!client) return <>{children}</>;

  return <ApolloProviderBase client={client}>{children}</ApolloProviderBase>;
}