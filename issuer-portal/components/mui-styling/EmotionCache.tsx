"use client";

import type {
  EmotionCache,
  Options as OptionsOfCreateCache,
} from "@emotion/cache";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import * as React from "react";

export interface NextAppDirEmotionCacheProviderProps {
  readonly options: Omit<OptionsOfCreateCache, "insertionPoint">;
  readonly CacheProvider?: (props: {
    value: EmotionCache;
    children: React.ReactNode;
  }) => React.JSX.Element | null;
  readonly children: React.ReactNode;
}

export const NextAppDirEmotionCacheProvider = (
  props: NextAppDirEmotionCacheProviderProps
) => {
  const {
    options,
    CacheProvider: DefaultCacheProvider = CacheProvider,
    children,
  } = props;

  const [{ cache, flush }] = React.useState(() => {
    const cache = createCache(options);
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }
    let styles = "";
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  return <DefaultCacheProvider value={cache}>{children}</DefaultCacheProvider>;
};
