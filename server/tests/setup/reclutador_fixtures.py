import pytest
from main import db
from models.schemes import Rol, Usuario, UsuarioRol

from tests.functional.auth.register_test import get_valid_user


@pytest.fixture
def registered_confirmed_reclutador_user(test_client, mocker):
    user_data = get_valid_user()

    mocked_fn = mocker.patch("routes.auth_routes.enviar_confirmacion_email")
    response = test_client.post("/auth/register", json=user_data)

    print(response.json)

    mocked_fn.assert_called_once_with(user_data["email"], user_data["username"])
    assert response.status_code == 201

    created_user = Usuario.query.filter_by(username=user_data["username"]).first()

    # Confirmar el mail del usuario falso manualmente
    created_user.confirmado = True

    reclutador_role = Rol.query.filter_by(slug="reclutador").first()
    if not reclutador_role:
        reclutador_role = Rol(
            nombre="Reclutador", permisos="reclutador_permisos", slug="reclutador"
        )
        db.session.add(reclutador_role)
        db.session.commit()

    userRol = UsuarioRol(id_usuario=created_user.id, id_rol=reclutador_role.id)
    db.session.add(userRol)
    db.session.commit()

    yield user_data

    db.session.delete(created_user)
    db.session.commit()


@pytest.fixture
def reclutador_client(test_client, registered_confirmed_reclutador_user):
    login_credentials = {
        "username": registered_confirmed_reclutador_user["username"],
        "password": registered_confirmed_reclutador_user["password"],
    }

    response = test_client.post("/auth/login", json=login_credentials)

    cookies = response.headers.getlist("Set-Cookie")

    token = ""
    for cookie in cookies:
        if cookie.startswith("access_token_cookie="):
            token = cookie.split("=")[1].split(";")[0]

    test_client.set_cookie("access_token_cookie", token, domain="localhost")

    yield test_client
