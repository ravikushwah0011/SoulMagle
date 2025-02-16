import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import ChatNotification from "./ChatNotification";
import AuthContext from "./context/authContext";
import "../App.css";

const Navbar = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-header">
        <div className="header">
        <h1 className="navbar-title">SoulMagle</h1>
        <button onClick={() => navigate("/")} className="navbar-button">
          Home
        </button>
        </div>
        <button
          onClick={toggleMobileMenu}
          className="navbar-hamburger"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <span className="hamburger-icon">&times;</span>
          ) : (
            <span className="hamburger-icon">&#9776;</span>
          )}
        </button>
      </div>
      <div className={`navbar-links ${mobileMenuOpen ? "open" : ""}`}>
        {currentUser ? (
          <span className="navbar-text">
            Hello, {currentUser.name}! 🎉
          </span>
      ) : (
        <>
          <button className="navbar-button" onClick={() => navigate("/login")}>Login/Sign Up</button>
          {/* <Link to="/login">Login</Link> | <Link to="/signup">Signup</Link> */}
        </>
      )}
      <button className="navbar-button" onClick={() => navigate("/profile")}>Profile</button>
      </div>
      <ChatNotification />
    </nav>
  );
};

export default Navbar;
