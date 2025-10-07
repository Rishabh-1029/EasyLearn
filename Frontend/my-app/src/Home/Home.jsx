import { useState, useRef, useEffect } from "react";
import "./Home.css";


// Functions
function Home() {


  // UserQuery
  const [query, setQuery] = useState("");


  // Message
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! How can I help you today?" },
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
        body: JSON.stringify({ user_query: userQuery }),
      });


      // Response checker 
      if (!res.ok) throw new Error("Server error " + res.status);


      // Updating AI response
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.response }]);
    }
    

    // Error Handling
    catch (error) {
      console.error("ERROR :", error);
      setMessages((prev) => [...prev, { sender: "bot", text: "Something went wrong!" }]);
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
        <span className="easy">Easy</span>
        <span className="learn">Learn</span>
      </div>


      {/* Chat Body */}
      <div className="chat-body">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${msg.sender === "user" ? "user" : "bot"}`}
          >
            {msg.text}
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
