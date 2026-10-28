// Einstieg des Datensatz-Editors (eigene Seite unter /editor/, gebaut als zweiter
// esbuild-Einstieg). Nutzt die Design-Tokens des Spiels plus eigene Editor-Styles.
import React from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/00-base.css';
import './editor.css';
import EditorApp from './EditorApp';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EditorApp />
  </React.StrictMode>,
);
