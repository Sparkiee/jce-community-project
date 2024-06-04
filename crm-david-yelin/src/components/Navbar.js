import React from "react";
import '../styles/Navbar.css';

function Navbar() {
    return (
        <header>
             <button>התנתק</button>
             <div className="logo">
                
             </div>
            <nav>
                <ul>
                    <li><a href="#">תקשורת</a></li>
                    <li><a href="#"> משימות</a></li>
                    <li><a href="#">ראשי</a></li>
                </ul>
            </nav>
            <img src={require('../assets/lol.png')} alt="logo" className="brand-logo"/>
        </header>
    );
}

export default Navbar;