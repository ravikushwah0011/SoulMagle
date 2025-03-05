// client/src/components/Login.js
import React, { useState, useContext, use } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/authContext";
import {motion} from "framer-motion";

import Navbar from "../Navbar";
import "./Pages.css";
// import appLogo from "../../assets/app_logo.jpg";

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
    profile_photo: null,
  });
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  const [step, setStep] = useState(1);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profile_photo: file });

      // Preview the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    setStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setStep((prevStep) => prevStep - 1);
  };

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
        await axios.post("/api/interests-embeddings", {
          userId,
          interests: formData.interests,
        });

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

  const handleIconClick = () => {
    document.getElementById("profile-upload").click();
  };

  return (
    <div>
      {/* <Navbar /> */}
      <div className="p-8 flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-4xl md:flex shadow-xl rounded-2xl overflow-hidden bg-white fade-in">
          {/* Left Panel */}
          <div className="bg-gradient-to-b from-sky-700 to-yellow-300 text-white text-center p-8 w-full md:w-1/2 justify-items-center">
            <h2 className="text-2xl font-semibold">Welcome!</h2>

            <div className="hidden md:flex flex-col justify-center items-center w-full relative mt-16">
              <div className="w-24 h-24 rounded-full overflow-hidden mt-2 border">
                <img
                  src="assets/image/app_logo.jpg"
                  alt="Logo"
                  className="mb-4 logo_img"
                />
              </div>

              <h2 className="text-2xl font-semibold">SoulMagle</h2>
              {/* <div className="absolute bottom-0 left-0 right-0 h-20 bg-white rounded-t-full"></div> */}
            </div>
            <p className="pt-8 text-center mt-2 text-sm">
              Join us to explore new Friends and connect with amazing people of
              your Interests
            </p>
          </div>

          {/* Right Panel (Form) */}
          <div className="w-full md:w-1/2 p-8">
            <h2 className="text-xl font-semibold text-gray-800 text-center">
              {isSignup ? "Create your account" : "Login"}
            </h2>
            <form className="mt-6" onSubmit={handleSubmit}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                {isSignup && (
                  <>
                    {step === 1 && (
                      <>
                        <h2 className="text-xl font-semibold text-center text-gray-800">Basic Info</h2>
                        <div>
                          <label className="block text-gray-600 text-start p-3">
                            Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full p-3 mt-1 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="mt-4">
                          <label className="block text-gray-600 text-start p-3">
                            Interests
                          </label>
                          <input
                            type="text"
                            name="interests"
                            value={formData.interests}
                            onChange={handleChange}
                            required
                            className="w-full p-3 mt-1 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <button onClick={handleNext} className="mt-6 w-1/2 bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600">
                        Next →                   
                        </button>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <h2 className="text-xl font-semibold text-center text-gray-800">Profile Picture</h2>
                          {/* Profile Image Upload */}
                          <div className="relative mb-4 flex flex-col items-center">
                            <label className="block text-gray-600">
                              {/* Profile Picture */}
                            </label>
                            <div className="w-24 h-24 rounded-full overflow-hidden mt-2 border border-blue-200">
                              {imagePreview ? (
                                <img
                                  src={imagePreview}
                                  alt="Profile Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                                  <img
                                    src="assets/image/blank-dp.png"
                                    alt="Upload"
                                    className="w-12 h-12"
                                  />
                                </div>
                              )}
                            </div>
                            <span
                              className="edit-icon sign-up-icon"
                              onClick={handleIconClick}
                            >
                              ✎
                            </span>

                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="mt-2"
                              id="profile-upload"
                            />
                          </div>
                    

                          <div className="mt-6 flex justify-between">
                            <button onClick={handleBack} className="p-3 border rounded-full text-gray-700 hover:bg-gray-200">
                              ← Back
                            </button>
                            <button onClick={handleNext} className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                              Next →
                            </button>
                          </div>
                      </>
                    )}
                  </>
                )}
                {(step === 3 || !isSignup) && (
                  <>
                    {isSignup && <h2 className="text-xl font-semibold text-center text-gray-800">Account Details</h2>}
                    <div className="mt-4">
                        <label className="block text-gray-600 text-start p-3">
                          E-mail Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full p-3 mt-1 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    <div className="mt-4">
                      <label className="block text-gray-600 text-start p-3">
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full p-3 mt-1 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center mt-4">
                    <input type="checkbox" id="terms" className="mr-2" />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree with{" "}
                      <a href="#" className="text-blue-500">
                        Terms & Conditions
                      </a>
                    </label>
                    </div>
                    <div className="mt-6 flex" style={!isSignup ? {justifyContent: "center"} : {justifyContent: "space-between"}}>
                       {isSignup &&  
                       <button onClick={handleBack} className="p-3 border rounded-full text-gray-700 hover:bg-gray-200">
                          ← Back
                        </button>}
                      <button className="w-1/2 p-3 text-white bg-blue-500 rounded-full hover:bg-blue-600">
                        {isSignup ? "Sign Up" : "Login"}
                      </button>
                    </div>
                  </>
                )}
                <div className="flex flex-col items-center justify-between mt-6">
                  <button
                    type="button"
                    onClick={() => setIsSignup(!isSignup)}
                    className="w-full p-3 ml-2 border rounded-full text-gray-700 hover:bg-gray-200 border-blue-400"
                  >
                    {isSignup
                      ? "Already have an account? Login"
                      : "Don't have an account? Sign Up"}
                  </button>
                </div>
                
              </motion.div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
