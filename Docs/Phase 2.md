## Phase 2

Now what i am thinking is to move ahead of the current simple langchain phase to true Easy-to-learn platform (RAG-based system)

Idea is simply to give user a capability to dynamically and provide specialised context it includes and is not limited to:

1. upload local documents (Docx, txt, pdf, md) of there choice and it will be the context of the system.
2. An web-app scrapper functionallity
   2.1. User can provide links and our scrapper will just scrape the data and will serve as context.
   2.2. An specialized tool capable of identifying top_k online articles/web-app and retrieve relevant context.

--- Note : Once the data is processed for the user will be saved in store - The uploaded document will be locked under user control means invisible to global store - The web scrapper is already publicaly avaialble will be stored in global store.

So, the store stratagy is simply of 2 level: one is User-level and another is Global-level.

--- Note: The idea is to be resource-effiecent and fast system.

The LLM stratagy - No any SOTA LLMs: Just Good enough LLMs to generate the correct text from the context, our stratagy and backend will retrieve the correct required context. (Any 3 Text-generation LLMs)

The Embedding stratagy - the embedded model has to chose wisely - it should be cheap and effiecient.

The Guardrails - Do not give out of the context answers.

The notes generator process - 3 levels: with more defined structure - capability to download MD, Docx, txt as notes.

The graph generator - Flow diagram, User flow diagram, or any possible tabular data which can be created using mermaid design with colours (clouflare open source allows this)

Image retrival from the Internet (if possible)

A dashboard to see the context of the user locally managable.

A dashboard to see the saved notes as on like blogs way.

The idea is to keep a user's private-data/uploaded-data limited to that user.

User has to log in !!

Frontend - Modern, Slick and user-friendly.
