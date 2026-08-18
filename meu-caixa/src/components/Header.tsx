import React from 'react';
import { Monitor, User, LogOut } from 'lucide-react';
import './Header.css';

export const Header: React.FC = () => {
  return (
    <header className="hi-tech-header">
      <div className="header-logo">
        <Monitor className="logo-icon" size={28} />
        <h1>MEU CAIXA <span>v2.0</span></h1>
      </div>
      <div className="header-actions">
        <div className="user-info">
          <User className="user-icon" size={20} />
          <span>Operador 01</span>
        </div>
        <button className="logout-btn">
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
};