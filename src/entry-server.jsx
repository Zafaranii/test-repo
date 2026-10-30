import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import './index.css';

export async function render(url) {
  const appHtml = renderToString(
    <App
      RouterComponent={StaticRouter}
      routerProps={{ location: url }}
      dehydratedState={null}
    />
  );

  return {
    appHtml,
    dehydratedState: null,
  };
}
