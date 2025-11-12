import { useState, useRef, useEffect } from "react";
import "./Home.css";

// Functions
function Home() {
  // UserQuery
  const [query, setQuery] = useState("");

  // Model & Level
  const [model, setModel] = useState("");
  const [level, setLevel] = useState("");

  // Message
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hey! This is EasyLearn, What you want to learn today?",
    },
  ]);

  // Ref To Last Message
  const messagesEndRef = useRef(null);

  // Scroll - Effect
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Submit Button
  const handleSubmit = async () => {
    if (!query.trim()) return;

    // Message State
    setMessages((prev) => [...prev, { sender: "user", text: query }]);
    const userQuery = query;
    setQuery("");

    try {
      // BackEnd interaction with FastAPI.
      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_query: userQuery,
          model: model || "gemini",
          level: level || "Short",
        }),
      });

      // Response checker
      if (!res.ok) throw new Error("Server error " + res.status);

      // Updating AI response
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.response,
          model: data.model || model || "Gemini",
          level: data.level || level || "Short",
        },
      ]);
    } catch (error) {
      // Error Handling
      console.error("ERROR :", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Something went wrong!" },
      ]);
    }
  };

  // Enter Key Handling
  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  // HTML Script
  return (
    <div className="chat-container">
      {/* EasyLearn Title */}
      <div className="chat-header">
        <div>
          <span className="easy">Easy</span>
          <span className="learn">Learn</span>
        </div>
        <div>
          {/* Select Model */}
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="Gemini">Gemini</option>
            <option value="DeepSeek">DeepSeek</option>
          </select>

          {/* Select Level */}
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="Short">Short</option>
            <option value="Descriptive">Descriptive</option>
            <option value="Detailed">Detailed</option>
          </select>
        </div>
      </div>

      {/* Chat Body */}
      <div className="chat-body">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${msg.sender === "user" ? "user" : "bot"}`}
          >
            {msg.sender === "bot" ? (
              <div className="bot-message-container">
                <div className="bot-header">
                  <span className="model-name">
                    {msg.model
                      ? msg.model.charAt(0).toUpperCase() + msg.model.slice(1)
                      : "Model"}
                  </span>
                  <span className="level-tag">
                    {msg.level
                      ? msg.level.charAt(0).toUpperCase() + msg.level.slice(1)
                      : "Level"}
                  </span>
                </div>
                <div className="bot-text">{msg.text}</div>
                <button
                  className="save-btn"
                  onClick={() => handleSaveMessage(msg)}
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="user-text">{msg.text}</div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="chat-input">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask anything..."
        />
        <button onClick={handleSubmit}>Send</button>
      </div>
    </div>
  );
}

export default Home;
