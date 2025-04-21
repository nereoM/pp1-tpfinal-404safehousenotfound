from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello_world():
    return "Hello, World!"

@app.route("/api/users") # Ruta de ejemplo
def get_users():
    return {
        "users": ["Alice", "Bob", "Charlie"]
    }

if __name__ == "__main__":
    app.run(debug=True) # by default, Flask corre en el puerto 5000