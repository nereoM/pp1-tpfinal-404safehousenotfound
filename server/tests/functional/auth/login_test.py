URL = "/auth/login"


def test_login_happy_path(test_client, registered_confirmed_user):
    # Setup
    login_credentials = {
        "password": registered_confirmed_user["password"],
        "username": registered_confirmed_user["username"],
    }

    response = test_client.post(URL, json=login_credentials)

    print(response.json)

    assert response.status_code == 200

    cookies = response.headers.getlist("Set-Cookie")
    assert any("access_token_cookie=" in cookie for cookie in cookies)


def test_login_incomplete_mail_confimartion_returns_401(test_client, registered_user):
    login_credentials = {
        "username": registered_user["username"],
        "password": registered_user["password"],
    }

    response = test_client.post(URL, json=login_credentials)

    print(response.json)

    assert response.status_code == 400


def test_login_unexistent_user_returns_401(test_client, registered_user):
    login_credentials = {"username": "fake-username", "password": "fake-password123"}

    response = test_client.post(URL, json=login_credentials)

    assert response.status_code == 401


def test_login_invalid_password_returns_400(test_client, registered_user):
    login_credentials = {
        "username": registered_user["username"],
        "password": "fake-password123",
    }

    response = test_client.post(URL, json=login_credentials)

    assert response.status_code == 401


def test_login_empty_body_returns_400(test_client):
    login_credentials = {}

    response = test_client.post(URL, json=login_credentials)

    assert response.status_code == 400
