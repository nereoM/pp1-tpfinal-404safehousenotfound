# Referencia https://testdriven.io/blog/flask-pytest/#fixtures

# Este archivo carga todos los fixture al entorno de test
# para que estén disponibles para ser usados en los casos de prueba

from setup.auth_fixtures import *
from setup.reclutador_fixtures import *
from setup.test_client import *
