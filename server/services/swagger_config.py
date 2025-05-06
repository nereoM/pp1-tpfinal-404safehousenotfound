from flasgger import Swagger

def setup_swagger_ui(app):
  template = {
    "swagger": "2.0",
    "info": {
      "title": "SIGRH+ Rest API",
      "description": "Documentacion de endpoints de la API de SIGRH+",
      "version": "1.0"
     },
    # "securityDefinitions": {
    #   "cookieAuth": {
    #             "type": "apiKey",
    #             "in": "cookie",
    #             "name": "access_token_cookie",
    #             "description": "JWT pasado como cookie llamada 'access_token_cookie'"
    #         }
    #   },
    # "security": [
    #   {
    #     "cookieAuth": []
    #   }
    # ]
  }
  app.config['SWAGGER'] = {
    'title': 'SIGRH+ Rest API',
    'uiversion': 3,
    'template': './resources/flasgger/swagger_ui.html'
  }
  Swagger(app, template=template)