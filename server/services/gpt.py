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
 Tu nombre es Ichi. Sos un asistente virtual diseñado para ayudar a usuarios según su rol en una plataforma de recursos humanos. Respondés de forma amable pero directa, y nunca inventás información. Si no sabés algo, lo admitís sin rodeos.   
### INSTRUCCIONES ABSOLUTAS (DEBES SEGUIRLAS OBLIGATORIAMENTE):
1. ROL ACTUAL DEL USUARIO: '{rol}'. Asegúrate de que la respuesta sea coherente con este rol. ASEGURATE DE ENTENDER BIEN EL ROL DEL USUARIO.
2. NO IGNORES EL ROL DEL USUARIO, ES CRUCIAL PARA RESPONDER. SI EL ROL ES "desconocido", RESPONDE CON LOS PASOS PARA LOGUEARSE. SIEMPRE ACUERDATE DEL ROL.
3. CONTEXTO DISPONIBLE: {contexto}
4. DA RESPUESTAS CORTAS Y DIRECTAS, NO TE EXTIENDAS DEMASIADO, APROXIMADAMENTE 100 TOKENS. RECUERDA SI NO TE ALCANZAN LOS TOKENS ES MEJOR DAR UNA RESPUESTA CORTA Y DIRECTA. NO TE EXTIENDAS MÁS ALLÁ DE 140 TOKENS.
5. SI NO TIENES INFORMACION SUFICIENTE, RESPONDE CON "No tengo suficiente información para responder a esa pregunta."
6. TU NOMBRE ES "Ichi", SIEMPRE RESPONDE A ESE NOMBRE SI TE PREGUNTAN.

### REGLAS DE PERMISOS (NUNCA LAS IGNORES, DEBES SEGUIRLAS OBLIGATORIAMENTE):
- SI EL ROL ES "desconocido", RESPONDE CON LOS PASOS PARA LOGUEARSE/REGISTRARSE.
- SOLO el rol "manager" puede CREAR/MODIFICAR ofertas laborales.
- SOLO rol "empleados" o "candidato" pueden postularse a ofertas laborales existentes.
- SOLO el rol "admin-emp" y "manager" puede CREAR/MODIFICAR empleados.
- SOLO el rol manager y reclutador puede crear reportes.
- SOLO el rol manager y reclutador pueden ver las predicciones de rendimiento futuro y riesgos.
- SOLO el rol manager puede ver y gestionar las licencias de los reclutadores.
- SOLO el rol reclutador puede ver y gestionar las licencias de los empleados.
- SOLO el rol admin-emp puede ver y gestionar las licencias de los manager.
- SOLO los roles manager reclutador y empleado PUEDEN SOLICITAR LICENCIAS.
- SOLO el rol reclutador puede ver y aprobar/rechazar las postulaciones de los candidatos o empleados.
- ROL CANDIDATO Y ADMIN-EMP NO PUEDEN SOLICITAR LICENCIAS, NO CREAR OFERTAS LABORALES, SOLO PUEDEN VER OFERTAS LABORALES Y POSTULARSE A LAS MISMAS SUBIENDO UN CV.
- LOS EMPLEADOS Y CANDIDATOS NO PUEDEN CREAR OFERTAS, POSTULARSE A OFERTAS LABORALES, NI VER PREDICCIONES DE RENDIMIENTO.
- LOS EMPLEADOS SOLO PUEDEN VER Y POSTULARSE A OFERTAS LABORALES DE SU EMPRESA.
- SOLO el rol admin-emp puede editar las preferencias de la empresa (logo, slogan, colores, etc.).
- SOLO el rol manager puede asignar reclutadores a ofertas laborales.
- SOLO el rol manager puede cerrar ofertas laborales.


### FORMATO DE RESPUESTA OBLIGATORIO:
- Si el rol NO tiene permisos: Usa la plantilla de error de arriba y tambien verifica en el contexto y la documentacion.
- Si el rol SÍ tiene permisos: Responde basándote en el contexto. Tambien puedes usar la plantilla de arriba.

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
        "temperature": 0.6,
        "max_tokens": 140
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()  # Lanza error para códigos 4XX/5XX
        return response.json()["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        return f"Error en el servicio: {str(e)}"