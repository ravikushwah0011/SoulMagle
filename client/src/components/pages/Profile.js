// client/src/components/Profile.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import "./profile.css";

const API_URL = process.env.REACT_APP_API_URL;

function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    interests: "",
    email: "",
    profile_photo: "",
  });
  const navigate = useNavigate();

  const [newImg, setNewImg] = useState("");

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
      profile_photo: storedUser.profile_photo,
    });
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImg(reader.result);
        setFormData((prevData) => {
          if (prevData.profile_photo === reader.result) return prevData;
          return { ...prevData, profile_photo: reader.result };
        });
      };
      reader.readAsDataURL(file);
    }
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
      setNewImg("");
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
    // <div style={{ padding: "1em" }}>

    //   {/* <Navbar /> */}
      
    //   <h2>User Profile</h2>
    //   {editing ? (
    //     <div>
    //       <div>
    //         <label>Name:</label>
    //         <input
    //           type="text"
    //           name="name"
    //           value={formData.name}
    //           onChange={handleChange}
    //         />
    //       </div>
    //       <div>
    //         <label>Interests:</label>
    //         <input
    //           type="text"
    //           name="interests"
    //           value={formData.interests}
    //           onChange={handleChange}
    //         />
    //       </div>
    //       <div>
    //         <label>Email:</label>
    //         <input
    //           type="email"
    //           name="email"
    //           value={formData.email}
    //           onChange={handleChange}
    //         />
    //       </div>
    //       <button onClick={saveProfile}>Save</button>
    //     </div>
    //   ) : (
    //     <div>
    //       <p>Name: {user?.name}</p>
    //       <p>Interests: {user?.interests}</p>
    //       <p>Email: {user?.email}</p>
    //       <button onClick={() => setEditing(true)}>Edit</button>
    //     </div>
    //   )}
    //   <div style={{ marginTop: "1em" }}>
    //     <h3>History</h3>
    //     <p>Chat history and activity logs can be implemented here.</p>
    //   </div>
    //   <div style={{ marginTop: "1em" }}>
    //     <h3>Settings</h3>
    //     <p>Theme settings and other preferences can be implemented here.</p>
    //   </div>
    //   <button onClick={logout}>Logout</button>
    // </div>
    <div className="profile-container">
      <h2 className="profile-title">Your Profile</h2>

      {/* Profile Photo Section */}
      <div className="profile-photo-container">
        <label htmlFor="profile-upload" className="profile-photo-label">
          <img
            src={newImg || user?.profile_photo}
            alt="Profile"
            className="profile-photo"
          />
          {/* <img src="/blank-dp.png" alt="Upload" className="camera-icon" /> */}
          { editing && <span className="edit-icon">✎</span>}
          
        </label>
        {editing && <input
          type="file"
          id="profile-upload"
          name="profile_photo"
          // value={formData.profile_photo}
          accept="image/*"
          onChange={handleProfileImageChange}
          /> }
      </div>

      {editing ? (
        <div className="profile-form">
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className="border border-yellow-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>

          <label>Interests:</label>
          <input type="text" name="interests" value={formData.interests} onChange={handleChange} className="border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="border border-yellow-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>

          <button className="save-button" onClick={saveProfile}>Save</button>
        </div>
      ) : (
        <div className="profile-details">
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Interests:</strong> {user?.interests}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <button className="edit-button" onClick={() => setEditing(true)}>Edit</button>
        </div>
      )}

      <div className="profile-section">
        <h3>History</h3>
        <p>Chat history and activity logs can be implemented here.</p>
      </div>

      <div className="profile-section">
        <h3>Settings</h3>
        <p>Theme settings and other preferences can be implemented here.</p>
      </div>

      <button className="logout-button" onClick={logout}>Logout</button>
    </div>
  

  );
}

export default Profile;
