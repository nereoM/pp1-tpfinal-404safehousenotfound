# generar_indice.py
import os
from langchain.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from config import Config


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RUTA_DOCUMENTOS = os.path.join(BASE_DIR, "..", "documentos_chatbot")

loader = DirectoryLoader(
    RUTA_DOCUMENTOS,
    glob="*.md",
    loader_cls=TextLoader,
    show_progress=True
)

documentos = loader.load()

splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=40)
fragmentos = splitter.split_documents(documentos)

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
vector_index = FAISS.from_documents(fragmentos, embeddings)

vector_index.save_local(os.path.join(BASE_DIR, "vector_index"))
print("✅ Índice vectorial guardado en 'vector_index/'")
