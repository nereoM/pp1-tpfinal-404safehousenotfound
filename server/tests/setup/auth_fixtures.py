import pytest
from main import db
from models.schemes import Usuario

from tests.functional.auth.register_test import get_valid_user


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
