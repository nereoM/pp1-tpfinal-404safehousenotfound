import pytest
from main import app, db
from models.schemes import (
    Rol,
)


def test_password_hashing(new_user):
    assert new_user._contrasena != "mysecretpassword"
    assert new_user.verificar_contrasena("mysecretpassword")
    assert not new_user.verificar_contrasena("wrongpassword")


def test_user_confirmation(new_user, session):
    assert not new_user.confirmado
    new_user.confirmar_usuario()
    session.flush()
    assert new_user.confirmado


# @pytest.mark.skip(reason="no way of currently testing this")
def test_user_roles(new_user, session):
    role = Rol(nombre="Admin", slug="admin")
    session.add(role)
    session.flush()

    new_user.roles.append(role)
    session.flush()

    assert new_user.tiene_rol("admin")
    assert not new_user.tiene_rol("user")
