import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()

if not os.environ.get("GOOGLE_API_KEY"):
    print("[ERROR] -- API NOT FOUND")

model = init_chat_model("gemini-2.5-flash", model_provider="google_genai")

def response(user_query):
    messages = [
        SystemMessage(content="You are a teacher who answers in 3 lines about the asked concept."),
        HumanMessage(content=user_query),
    ]

    response = model.invoke(messages)
    return response.content

if __name__ == "__main__":
    response("Hello World!")