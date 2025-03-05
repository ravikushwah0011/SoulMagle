// client/src/components/Profile.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";

const API_URL = process.env.REACT_APP_API_URL;

function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    interests: "",
    email: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setUser(storedUser);
    setFormData({
      // user_id: storedUser.id,
      name: storedUser.name,
      interests: storedUser.interests,
      email: storedUser.email,
    });
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const saveProfile = async () => {
    try {
      const res = await axios.put(`/api/profile/${user.id}`, formData);
      setUser(res.data.user);

      console.log(user.id);
      const userId = user.id;
      await axios.post("/api/interests-embeddings", {userId, interests: formData.interests})

      
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  const logout = async () => {
    const userId = localStorage.getItem("userId") || user.id; // Get stored user ID
    console.log(userId);

    if (!userId) {
      console.error(userId,"No userId found. Cannot log out.");
      return;
    }

    try {
      await axios.post(`${API_URL}/api/logout`, { userId });

      // ✅ Clear local storage
      localStorage.removeItem("user");
      console.log(userId);

      localStorage.removeItem("token");

      // ✅ Redirect to login page
      navigate("/login");
      // window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div style={{ padding: "1em" }}>

      {/* <Navbar /> */}
      
      <h2>User Profile</h2>
      {editing ? (
        <div>
          <div>
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Interests:</label>
            <input
              type="text"
              name="interests"
              value={formData.interests}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <button onClick={saveProfile}>Save</button>
        </div>
      ) : (
        <div>
          <p>Name: {user?.name}</p>
          <p>Interests: {user?.interests}</p>
          <p>Email: {user?.email}</p>
          <button onClick={() => setEditing(true)}>Edit</button>
        </div>
      )}
      <div style={{ marginTop: "1em" }}>
        <h3>History</h3>
        <p>Chat history and activity logs can be implemented here.</p>
      </div>
      <div style={{ marginTop: "1em" }}>
        <h3>Settings</h3>
        <p>Theme settings and other preferences can be implemented here.</p>
      </div>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Profile;
