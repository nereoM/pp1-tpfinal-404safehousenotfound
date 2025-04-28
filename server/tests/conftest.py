# Referencia https://testdriven.io/blog/flask-pytest/#fixtures

import pytest
from main import app, db
from models.schemes import Usuario

from tests.functional.auth.register_test import get_valid_user


# Establece un contexto para testear la aplicacion
@pytest.fixture(scope="module")
def test_client():
    """Provides an application context for the tests."""
    with app.test_client() as testing_client:
        with app.app_context():
            yield testing_client


@pytest.fixture(scope="function")
def session(test_client):
    """Creates a new database session for a test."""
    connection = db.engine.connect()
    transaction = connection.begin()

    options = dict(bind=connection, binds={})
    sess = db._make_scoped_session(options=options)

    db.session = sess  # Override the global session

    yield sess

    transaction.rollback()
    connection.close()
    sess.remove()


# Creacion de usuario
@pytest.fixture(scope="function")
def new_user(session):
    user = Usuario(
        nombre="John",
        apellido="Doe",
        username="johndoe",
        correo="john@example.com",
        contrasena="mysecretpassword",
    )
    session.add(user)
    session.flush()
    return user


@pytest.fixture
def registered_user(test_client, mocker):
    user_data = get_valid_user()

    mocker.patch("routes.auth_routes.enviar_confirmacion_email")
    response = test_client.post("/auth/register", json=user_data)

    assert response.status_code == 201

    yield user_data

    # Teardown: Delete the user after the test
    user = Usuario.query.filter_by(username=user_data["username"]).first()
    if user:
        db.session.delete(user)
        db.session.commit()


@pytest.fixture
def registered_confirmed_user(test_client, mocker):
    user_data = get_valid_user()

    mocker.patch("routes.auth_routes.enviar_confirmacion_email")
    response = test_client.post("/auth/register", json=user_data)

    print("f")

    # Confirmar email del usuario
    user = Usuario.query.filter_by(username=user_data["username"]).first()
    print(f"usuario fetchado: {user}")

    user.confirmado = True
    db.session.commit()

    assert response.status_code == 201

    yield user_data

    # Teardown: Delete the user after the test
    user = Usuario.query.filter_by(username=user_data["username"]).first()
    if user:
        db.session.delete(user)
        db.session.commit()


@pytest.fixture
def logged_token(test_client, registered_confirmed_user):
    login_credentials = {
        "username": registered_confirmed_user["username"],
        "password": registered_confirmed_user["password"],
    }

    response = test_client.post("/auth/login", json=login_credentials)

    cookies = response.headers.getlist("Set-Cookie")

    token = ""
    for cookie in cookies:
        if cookie.startswith("access_token_cookie="):
            token = cookie.split("=")[1].split(";")[0]

    yield token
