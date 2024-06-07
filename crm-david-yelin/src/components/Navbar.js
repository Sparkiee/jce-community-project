import React from "react";
import '../styles/Navbar.css';

function Navbar() {
    return (
        <header>
            <button>התנתק</button>
            <div className="logo">
                <img src={require('../assets/profile.jpeg')} alt="logo" className="profile-logo" />
            </div>
            <nav>
            <ul>
                    <li>
                        <a href="#">תקשורת</a>
                        <ul className="dropdown">
                            <li><a href="#">משהו</a></li>
                            <li><a href="#">משהו</a></li>
                            <li><a href="#">משהו</a></li>
                        </ul>
                    </li>
                    <li>
                        <a href="#">משימות</a>
                        <ul className="dropdown">
                            <li><a href="#">הוסף משימה</a></li>
                            <li><a href="#">צפה במשימות</a></li>
                            <li><a href="#">שנה משימה</a></li>
                        </ul>
                    </li>
                    <li><a href="#">ראשי</a></li>
                </ul>
            </nav>
            <img src={require('../assets/lol.png')} alt="logo" className="brand-logo" />
        </header>
    );
}

export default Navbar;
