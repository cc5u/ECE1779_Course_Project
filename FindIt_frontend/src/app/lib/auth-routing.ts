type LocationLike = {
  pathname: string;
  search?: string;
  hash?: string;
};

export interface AuthRedirectState {
  from: LocationLike;
}

export function buildAuthRedirectState(location: LocationLike): AuthRedirectState {
  return {
    from: {
      pathname: location.pathname,
      search: location.search ?? "",
      hash: location.hash ?? "",
    },
  };
}

export function getPostAuthRedirectPath(state: unknown, fallback = "/home") {
  if (!state || typeof state !== "object" || !("from" in state)) {
    return fallback;
  }

  const from = (state as AuthRedirectState).from;

  if (!from?.pathname || !from.pathname.startsWith("/")) {
    return fallback;
  }

  return `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`;
}
