import * as React from "react";
import Knock, { Feed, FeedStoreState } from "@knocklabs/client";
import styled from "@emotion/styled";
import create, { UseStore } from "zustand";
import { FilterStatus } from "../../constants";
import * as theme from "../../theme";

export interface KnockFeedProviderState {
  knock: Knock;
  feedClient: Feed;
  useFeedStore: UseStore<FeedStoreState>;
  status: FilterStatus;
  setStatus: (status: FilterStatus) => void;
}

const FeedStateContext = React.createContext<KnockFeedProviderState | null>(
  null
);

export interface KnockFeedProviderProps {
  apiKey: string;
  userId: string;
  userToken?: string;
  feedId: string;
  host?: string;
}

const Container = styled.div`
  font-family: ${theme.typography.sanserif}!important;
  margin: 0 !important;
  padding: 0 !important;

  * {
    font-family: ${theme.typography.sanserif}!important;
    box-sizing: border-box;
  }
`;

export const KnockFeedProvider: React.FC<KnockFeedProviderProps> = ({
  apiKey,
  userId,
  feedId,
  userToken,
  host,
  children,
}) => {
  const [status, setStatus] = React.useState(FilterStatus.All);

  const knock = React.useMemo(() => {
    const knock = new Knock(apiKey, { host });
    knock.authenticate(userId, userToken);

    return knock;
  }, [apiKey, host, userId, userToken]);

  const [feedClient, useFeedStore] = React.useMemo(() => {
    const feedClient = knock.feeds.initialize(feedId);
    const useFeedStore = create(feedClient.store);

    return [feedClient, useFeedStore];
  }, [knock, feedId]);

  React.useEffect(() => {
    feedClient.listenForUpdates();
    return () => knock.teardown();
  }, [feedClient]);

  React.useEffect(() => {
    feedClient.fetch({ status });
  }, [feedClient, status]);

  const state = {
    knock,
    feedClient,
    useFeedStore,
    status,
    setStatus,
  };

  return (
    <FeedStateContext.Provider value={state}>
      <Container>{children}</Container>
    </FeedStateContext.Provider>
  );
};

export function useKnockFeed(): KnockFeedProviderState {
  const context = React.useContext(FeedStateContext);
  if (context === undefined) {
    throw new Error("useFeedState must be used within a FeedProvider");
  }
  return context as KnockFeedProviderState;
}
