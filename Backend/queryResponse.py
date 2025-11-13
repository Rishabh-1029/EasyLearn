import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage


load_dotenv()

# --- Cache for loaded models ---
MODEL_CACHE = {}



# ------------------ Model Selection ------------------

def get_model(model_name: str):
  
    # Return a cached model instance. If not available, initialize and cache it.

    name = model_name.lower()

    # If model already initialized, return it
    if name in MODEL_CACHE:
        return MODEL_CACHE[name]

    # Otherwise, initialize once
    if name == "gemini":
        key = os.environ.get("GOOGLE_API_KEY")
        if not key:
            raise ValueError("[ERROR] GOOGLE API key missing. Please set GOOGLE_API_KEY in your .env.")
        model = init_chat_model("gemini-2.5-flash", 
                                model_provider="google_genai", 
                                api_key = key
                            )
        
    elif name == "llama":
        key = os.environ.get("HF_AI_TOKEN")
        if not key:
            raise ValueError("[ERROR] Hugging Face Meta llama API key missing. Please set HF_AI_TOKEN in your .env.")
        model = init_chat_model("meta-llama/Llama-3.1-8B-Instruct:novita",
                                model_provider="openai",
                                api_key = key,
                                base_url="https://router.huggingface.co/v1"
                            )
        
    elif name == "deepseek":
        key = os.environ.get("HF_AI_TOKEN")
        if not key:
            raise ValueError("[ERROR] DeepSeek API key missing. Please set HF_AI_TOKEN in your .env.")
        model = init_chat_model("deepseek-ai/DeepSeek-V3-0324:novita",
                                model_provider="openai",
                                api_key = key,
                                base_url="https://router.huggingface.co/v1"
                            )
        
    elif name == "chatgpt":
        key = os.environ.get("HF_AI_TOKEN")
        if not key:
            raise ValueError("[ERROR] DeepSeek API key missing. Please set HF_AI_TOKEN in your .env.")
        model = init_chat_model("openai/gpt-oss-20b:groq",
                                model_provider="openai",
                                api_key = key,
                                base_url="https://router.huggingface.co/v1"
                            )
        
    elif name == "nvidia":
        key = os.environ.get("HF_AI_TOKEN")
        if not key:
            raise ValueError("[ERROR] DeepSeek API key missing. Please set HF_AI_TOKEN in your .env.")
        model = init_chat_model("nvidia/NVIDIA-Nemotron-Nano-12B-v2:nebius",
                                model_provider="openai",
                                api_key = key,
                                base_url="https://router.huggingface.co/v1"
                            )
    else:
        raise ValueError(f"Unknown model '{model_name}'.")

    # Cache it for future use
    MODEL_CACHE[name] = model
    return model




# ------------------ Response Function ------------------

def response(user_query: str, model_name: str = "Gemini", level: str = "Short"):
    
    try:
        model = get_model(model_name)
    except ValueError as err:
        return str(err)

    # Level-based system prompt
    level_prompts = {
        "short": "You are a teacher. Explain in 3-4 simple lines.",
        "descriptive": "You are a teacher. Explain in moderate detail (around 7-8 lines).",
        "detailed": "You are a detailed instructor. Explain deeply in around 10-15 lines, with examples if needed.",
    }

    system_prompt = level_prompts.get(level.lower(), level_prompts["short"])

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_query),
    ]

    try:
        ai_response = model.invoke(messages)
        return ai_response.content
    except Exception as e:
        return f"Something went wrong while generating the response with model '{model_name}': {e}"



if __name__ == "__main__":
    print(response("Explain quantum computing in simple words", "Gemini", "Descriptive"))