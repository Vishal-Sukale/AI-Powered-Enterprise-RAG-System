from typing import List, Optional
from langchain_groq import ChatGroq
from app.config import settings

_llm_instance: ChatGroq | None = None


def get_llm() -> ChatGroq:
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = ChatGroq(
            model=settings.LLM_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0.1,
            max_tokens=1024,
        )
    return _llm_instance


def _format_history(history: Optional[List[dict]]) -> str:
    if not history:
        return ""
    recent = history[-6:]
    lines = []
    for turn in recent:
        role_label = "User" if turn.get("role") == "user" else "Assistant"
        lines.append(f"{role_label}: {turn.get('content', '')}")
    return "Previous conversation (for follow-up context):\n" + "\n".join(lines) + "\n\n"


def build_prompt(question: str, context: str, history: Optional[List[dict]] = None) -> str:
    history_block = _format_history(history)
    return f"""You are a careful, precise assistant answering questions about uploaded documents.

Instructions:
- Read ALL the context chunks below fully before answering.
- Synthesize information across chunks when relevant.
- If the context reasonably answers the question (even if phrased differently), answer using it directly.
- Only say the information isn't available if you have genuinely checked all the context.
- Use the previous conversation to understand follow-up questions.
- Be concise, well-organized, and use bullet points for lists when appropriate.
- Do not invent facts not supported by the context.

{history_block}Context:
{context}

Question: {question}

Answer:"""


def generate_answer(question: str, context: str, history: Optional[List[dict]] = None) -> str:
    llm = get_llm()
    prompt = build_prompt(question, context, history)
    response = llm.invoke(prompt)
    return response.content


def stream_answer(question: str, context: str, history: Optional[List[dict]] = None):
    llm = get_llm()
    prompt = build_prompt(question, context, history)
    for chunk in llm.stream(prompt):
        if chunk.content:
            yield chunk.content

def _parse_question_list(raw_text: str, max_items: int = 4) -> List[str]:
    """Extracts a clean list of questions from an LLM response, one per line."""
    lines = [line.strip(" -*\u2022\t") for line in raw_text.strip().split("\n")]
    questions = [line for line in lines if line and line.endswith("?")]
    return questions[:max_items]


def generate_suggested_questions(document_sample: str, filename: str) -> List[str]:
    """Generates natural starter questions for a newly uploaded document."""
    llm = get_llm()
    prompt = f"""Based on this excerpt from a document called "{filename}", write exactly 4 short,
natural questions a user would realistically ask about it. One question per line,
each ending in a question mark. No numbering, no extra commentary.

Excerpt:
{document_sample[:2000]}

Questions:"""
    response = llm.invoke(prompt)
    return _parse_question_list(response.content, max_items=4)


def generate_related_questions(question: str, answer: str) -> List[str]:
    """Generates follow-up questions — powers 'You may also ask'."""
    llm = get_llm()
    prompt = f"""A user asked: "{question}"
The assistant answered: "{answer[:800]}"

Write exactly 3 short, natural follow-up questions the user might ask next.
One per line, each ending in a question mark. No numbering, no extra commentary.

Follow-up questions:"""
    response = llm.invoke(prompt)
    return _parse_question_list(response.content, max_items=3)
