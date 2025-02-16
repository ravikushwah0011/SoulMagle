// client/src/components/Login.js
import React, { useState, useContext, use } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/authContext";

import Navbar from "../Navbar";

import { useSocket } from "../context/socketContext";


function Login() {
  const socket = useSocket();
  const { login } = useContext(AuthContext);

  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    interests: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) {
        const res = await axios.post("/api/signup", formData);
        // localStorage.setItem("user", JSON.stringify(res.data.user));

        // Converts Interests into vector embeddings
        const userId = res.data.user.id;
        await axios.post("/api/interests-embeddings",  {userId, interests: formData.interests})

        login(res.data.user);
        socket.emit("register", res.data.user.id); // ✅ Register user after login
      } else {
        const res = await axios.post("/api/login", formData);
        login(res.data.user);
        // localStorage.setItem("user", JSON.stringify(res.data.user));
        console.log(res.data.user.id);

        socket.emit("register", res.data.user.id); // ✅ Register user after login
        console.log("User registered with socket:", res.data.user.id);
      }
      // login(response.data.user); // ✅ Update global auth state
      navigate("/");
      // window.location.href = '/';
    } catch (error) {
      console.error(error);
      alert("Error during login or sign up");
    }
  };

  return (
    <div style={{ padding: "1em" }}>

      {/* <Navbar /> */}
      
      <h2>{isSignup ? "Sign Up" : "Login"}</h2>
      <form onSubmit={handleSubmit}>
        {isSignup && (
          <>
            <div>
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Interests:</label>
              <input
                type="text"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button // onClick={() => setFormData(!formData.is_live)}
          type="submit"
        >
          {isSignup ? "Sign Up" : "Login"}
        </button>
      </form>
      <button onClick={() => setIsSignup(!isSignup)}>
        {isSignup
          ? "Already have an account? Login"
          : "Don't have an account? Sign Up"}
      </button>
    </div>
  );
}

export default Login;
