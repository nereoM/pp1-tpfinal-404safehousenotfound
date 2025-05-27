import os
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "sbert_model")

modelo_sbert = SentenceTransformer(MODEL_PATH)

