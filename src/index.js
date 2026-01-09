import { render } from "@wordpress/element";
import { registerPlugin } from '@wordpress/plugins';
import './index.css';
import App from "./App";
import MagnetSidebar from "./Admin/Components/MagnetWidget";

// Global Error Handler for Debugging
window.onerror = function(message, source, lineno, colno, error) {
    console.error('ApexLink Global Error:', message, source, lineno, colno, error);
    const errorMsg = `Critical Error: ${message}\nLine: ${lineno}\nFile: ${source}`;
    
    // Create floating error box
    const box = document.createElement('div');
    box.style.position = 'fixed';
    box.style.bottom = '20px';
    box.style.left = '20px';
    box.style.backgroundColor = '#be123c';
    box.style.color = 'white';
    box.style.padding = '20px';
    box.style.borderRadius = '12px';
    box.style.zIndex = '999999';
    box.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    box.style.maxWidth = '400px';
    box.style.fontFamily = 'monospace';
    box.style.fontSize = '12px';
    box.innerHTML = `<strong>CRASH DETECTED:</strong><br/>${message}<br/><br/><button onclick="this.parentElement.remove()" style="background:white;color:black;border:none;padding:5px 10px;border-radius:4px;cursor:pointer">Dismiss</button>`;
    document.body.appendChild(box);
};

// Dashboard Root
const root = document.getElementById("wp-apexlink-admin-root");
if (root) {
  render(<App />, root);
}

// Gutenberg Sidebar Plugin
if (window.wp && window.wp.editPost) {
  registerPlugin('apexlink-magnet', {
    render: MagnetSidebar
  });
}
