import React from 'react';
import { Monitor, ShoppingCart, Package, Lock, BarChart3 } from 'lucide-react';
import './Header.css';

export function Header() {
  return (
    <header className="main-header">
      <div className="logo-container">
        <Monitor className="logo-icon" size={28} />
        <h1>Mercado <span>Bom Jesus</span></h1>
      </div>
      <nav className="nav-menu">
        <button className="nav-item active"><ShoppingCart size={18} /> Caixa</button>
        <button className="nav-item"><Package size={18} /> Fichas</button>
        <button className="nav-item"><Package size={18} /> Mercadorias</button>
        <button className="nav-item"><Lock size={18} /> Cofre</button>
        <button className="nav-item"><BarChart3 size={18} /> Relatórios</button>
      </nav>
    </header>
  );
}