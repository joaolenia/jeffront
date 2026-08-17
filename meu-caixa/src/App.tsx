import React from 'react';
import { Header } from './components/Header';
import { Pdv } from './components/Pdv';
import './App.css';

function App() {
  return (
    <div className="app-container">
      {/* Aqui colocamos o Header que vai ficar sempre no topo */}
      <Header />
      
      {/* Aqui chamamos a tela do PDV que ocupa o resto do espaço */}
      <Pdv />
    </div>
  );
}

export default App;