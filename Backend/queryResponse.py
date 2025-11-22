import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field


load_dotenv()

# --- Cache for loaded models ---
MODEL_CACHE = {}

class ShortResponse(BaseModel):
    title: str = Field(description="Short-title")
    summary: str = Field(description="4-5 Line explanation")
    example: str = Field(description="Simple example")

class DescriptiveResponse(BaseModel):
    title: str = Field(description="Short-title")
    summary: str = Field(description="7-8 Line explanation") 
    example: str = Field(description="Simple example")
class DetailedResponse(BaseModel):
    title: str = Field(description="Short-title")
    summary: str = Field(description="7-8 Line explanation") 
    key_points: list[str] = Field(description="Important bullet points")
    example: str = Field(description="descriptive example")

SCHEMA_MAP = {
    "Short": ShortResponse,
    "Descriptive": DescriptiveResponse,
    "Detailed": DetailedResponse
}


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

    schema_class = SCHEMA_MAP.get(level, ShortResponse)
    parser = PydanticOutputParser(pydantic_object=schema_class)
    format_instruction = parser.get_format_instructions()

    # Level-based system prompt
    # level_prompts = {
    #     "short": "You are a teacher. Explain in 3-4 simple lines.",
    #     "descriptive": "You are a teacher. Explain in moderate detail (around 7-8 lines).",
    #     "detailed": "You are a detailed instructor. Explain deeply in around 10-15 lines, with examples if needed.",
    # }

    # system_prompt = level_prompts.get(level.lower(), level_prompts["short"])

    system_prompt = f""" You are an intelligent teaching expert of {user_query} Respond ONLY in valid JSON format. Follow this structure exactly: {format_instruction} with no bold strings"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_query),
    ]

    try:
        ai_response = model.invoke(messages)
        parsed = parser.parse(ai_response.content)
        return parsed
    
    except Exception as e:
        return f"Something went wrong while generating the response with model '{model_name}': {e}"



if __name__ == "__main__":
    print(response("Explain quantum computing in simple words", "Gemini", "Descriptive"))