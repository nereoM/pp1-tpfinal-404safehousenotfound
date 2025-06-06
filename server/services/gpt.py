from .config import Config
import os
import requests  # <-- Asegúrate de importarlo
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VECTOR_INDEX_PATH = os.path.join(BASE_DIR, "vector_index")

vector_index = FAISS.load_local(
    VECTOR_INDEX_PATH,
    embeddings,
    allow_dangerous_deserialization=True
)

def generar_respuesta_gpt(mensaje, rol):
    documentos_relacionados = vector_index.similarity_search(mensaje, k=3)
    contexto = "\n\n".join([doc.page_content for doc in documentos_relacionados])

    prompt_sistema = f"""
### INSTRUCCIONES ABSOLUTAS (DEBES SEGUIRLAS):
1. ROL ACTUAL DEL USUARIO: '{rol}'
2. CONTEXTO DISPONIBLE: {contexto}

### REGLAS DE PERMISOS (NUNCA LAS IGNORES):
- SOLO los roles 'admin-emp' y 'manager' pueden CREAR/MODIFICAR ofertas.
- Si el rol es 'candidato' o 'reclutador' y pregunta sobre CREAR ofertas, RESPONDE EXACTAMENTE:
   "Error de permisos: Tu rol '{rol}' no te permite realizar esta acción. Contacta a un manager o administrador."

### FORMATO DE RESPUESTA OBLIGATORIO:
- Si el rol NO tiene permisos: Usa la plantilla de error de arriba.
- Si el rol SÍ tiene permisos: Responde basándote en el contexto.

### EJEMPLO:
Usuario (rol: reclutador, candidato o empleado): "Cómo creo una oferta?"
Respuesta: "Error de permisos: Tu rol no te permite realizar esta acción."
""".strip()

    # Llamada a Groq (versión depurada)
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {Config.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": mensaje}
        ],
        "temperature": 0.4,
        "max_tokens": 80
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()  # Lanza error para códigos 4XX/5XX
        return response.json()["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        return f"Error en el servicio: {str(e)}"