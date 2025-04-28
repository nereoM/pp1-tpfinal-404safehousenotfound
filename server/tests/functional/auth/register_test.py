from typing import TypedDict

import allure
from main import db
from models.schemes import Usuario

URL = "/auth/register"


class UserData(TypedDict):
    name: str
    surname: str
    username: str
    email: str
    password: str


def get_valid_user() -> UserData:
    return {
        "name": "John",
        "surname": "Doe",
        "username": "deleteme",
        "email": "testemail@gmail.com",
        "password": "1password!",
    }


def test_register_user_happy_path(mocker, test_client):
    data = get_valid_user()

    enviar_mail_mock = mocker.patch("routes.auth_routes.enviar_confirmacion_email")
    response = test_client.post(URL, json=data)

    print(response.json)

    # Assert mocked fn called
    enviar_mail_mock.assert_called_once_with(data["email"], data["username"])

    assert response.status_code == 201

    # Teardown
    user = Usuario.query.filter_by(username="deleteme").first()
    db.session.delete(user)
    db.session.commit()


def test_register_user_empty_body_returns_400(test_client):
    empty_data = {}

    response = test_client.post(URL, json=empty_data)

    assert response.status_code == 400


@allure.description(
    "Prueba que un usuario no puede registrarse si la contraseña no contiene al menos 8 carácteres."
)
def test_register_user_short_password_returns_400(test_client):
    data = get_valid_user()
    invalid_password = "1passw!"
    data["password"] = invalid_password

    response = test_client.post(URL, json=data)

    print(response.json)

    assert response.status_code == 400


@allure.description(
    "Prueba que un usuario no puede registrarse si la contraseña no contiene al menos un signo de puntuación."
)
def test_register_user_invalid_password_1_returns_400(test_client):
    data = get_valid_user()
    invalid_password = "Password1"
    data["password"] = invalid_password

    response = test_client.post(URL, json=data)

    print(response.json)

    assert response.status_code == 400


@allure.description(
    "Prueba que un usuario no puede registrarse si la contraseña no contiene al menos una mayúscula."
)
def test_register_user_invalid_password_2_returns_400(test_client):
    data = get_valid_user()
    invalid_password = "!password1"
    data["password"] = invalid_password

    response = test_client.post(URL, json=data)

    print(response.json)

    assert response.status_code == 400


@allure.description(
    "Prueba que un usuario no puede registrarse si la contraseña no contiene al menos un número."
)
def test_register_user_invalid_password_3_returns_400(test_client):
    data = get_valid_user()
    invalid_password = "!Password"
    data["password"] = invalid_password

    response = test_client.post(URL, json=data)

    print(response.json)

    assert response.status_code == 400


def test_register_user_already_exists_returns_400(test_client):
    existentUser = Usuario.query.first()

    data = get_valid_user()
    data["username"] = existentUser.username

    response = test_client.post(URL, json=data)

    print(response.json)

    assert response.status_code == 400
