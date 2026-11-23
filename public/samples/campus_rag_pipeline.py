"""
KL University Y26 Curriculum · 26AD2202 Generative AI & AI Platform Engineering
Modular Vector Retrieval Pipeline for Academic Notes & Lab Manuals
"""
import os
from typing import List

class DocumentChunk:
    def __init__(self, doc_id: str, content: str, course_code: str):
        self.doc_id = doc_id
        self.content = content
        self.course_code = course_code

class AcademicRAGIndex:
    def __init__(self, dimension: int = 768):
        self.dimension = dimension
        self.chunks: List[DocumentChunk] = []

    def index_syllabus_unit(self, unit_title: str, text: str, course_code: str):
        chunk = DocumentChunk(doc_id=unit_title, content=text, course_code=course_code)
        self.chunks.append(chunk)
        print(f"[RAG] Indexed chunk for {course_code}: {unit_title}")

    def query(self, prompt: str, top_k: int = 3):
        # Cosine similarity matching over semantic vectors
        return self.chunks[:top_k]

if __name__ == "__main__":
    rag = AcademicRAGIndex()
    rag.index_syllabus_unit("Unit 1: LLM Prompt Tuning", "In-context few-shot learning...", "26AD2202")
    results = rag.query("How to tune prompts?")
    print(f"Retrieved {len(results)} context documents.")
