// src/components/AIMatchSearch.js
import React, { useContext, useState } from "react";

import AuthContext from "../context/authContext";
import { ChatContext } from "../context/ChatContext";
import UserCard from "./UserCard";
import './routes.css'
import { ClipLoader } from 'react-spinners';

const API_URL = process.env.REACT_APP_API_URL;

const AIMatchSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const { currentUser } = useContext(AuthContext);
  const {requestChat} = useContext(ChatContext)
  
  const [explanation, setExplanation] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query) {
    setIsLoading(false);
    setError("Please enter a search query.");
    return;
    }
    else {
      setError(null);
      setIsLoading(true);
    }
    try{
    const res = await fetch(`${API_URL}/api/search-users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, userId: currentUser.id }),
    });
    const data = await res.json();

    // console.log(data);

    setResults(data);

  }
  catch (err) {
      setError('Failed to fetch results. Please try again.');
    } finally {
      setIsLoading(false);
    }

    // console.log(data.explanation);
  };

  // // Inside the match-card component

  // const fetchExplanation = async (userId) => {
  //   const res = await fetch(`/api/generate-explanation/${userId}`);
  //   const text = await res.text();
  //   setExplanation(text);
  // };

  return (
    <div className="search-container">
      <input
        className="rounded-lg p-2 border border-pink-700"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for users by interests..."
      />
      <button onClick={handleSearch} disabled={isLoading}
        className="rounded-lg p-2 border border-pink-700 bg-gradient-to-b from-sky-700 to-yellow-300 text-white hover:bg-gradient-to-t hover:from-sky-700 hover:to-yellow-300"
      >
        {isLoading ? "Searching..." : "Search"}
      </button>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="text-center loading-spinner">
          {/* Add your spinner here */}
          <ClipLoader size={50} color="#3498db" />
          <p>Finding 💫 your Soulmates...🚀</p>
        </div>
      ) :
      <div className="results-container">
        {results.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            showLastActive={!user.is_live}
            // requestChat={requestChat}
            explanation={user.explanation}
          />
        ))}
      </div>}
    </div>
  );
};

export default AIMatchSearch;
