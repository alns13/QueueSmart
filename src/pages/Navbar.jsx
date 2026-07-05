import React, { useState } from 'react';

export default function Navbar() {
    const [activeItem, setActiveItem] = useState('Home');
  
    const menuItems = ['Home', 'Join Queue', 'View Status', 'History'];
  
    return (
      <nav className="navbar">
        <div className="navbar-logo">
          <h2>QueueSmart  (this is a placeholder for a logo later)</h2>
        </div>
        <ul className="navbar-links">
          {menuItems.map((item) => (
            <li
              key={item} 
              className={`navbar-item ${activeItem === item ? 'active' : ''}`}
              onClick={() => setActiveItem(item)}>
              {item}
            </li>
          ))}
        </ul>
      </nav>
    );
  }