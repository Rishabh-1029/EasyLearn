import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");

const handleSubmit = async () => {
  try{
    const res = await fetch("http://localhost:8000/ask",{
      method: "POST",
      headers: {
        "content-Type":"application/json"
      },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    setResponse(data.response);
  } catch(error){
    console.error("ERROR : ", error);
    setResponse("Something went wrong!")
  }
};

  return (
    <>
    <div className='App'>
      <h2>EasyLearn</h2>
      <input
        type='text'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Enter Your Query'
      />
      <button onClick={handleSubmit}>Send</button>
      <p> {response} </p>
    </div>
    </>
  );
}

export default App
