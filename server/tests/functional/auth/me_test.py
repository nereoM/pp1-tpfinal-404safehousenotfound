URL = "/auth/me"


def test_get_profile_happy_path(test_client, logged_token):
    test_client.set_cookie("access_token_cookie", logged_token, domain="localhost")

    response = test_client.get(URL)

    print(response.json)

    assert response.status_code == 200

    expected_keys = {"id", "nombre", "correo", "roles"}
    assert expected_keys.issubset(response.json.keys())

    # Teardown
    test_client.delete_cookie(key="access_token_cookie", domain="localhost")


def test_get_profile_empty_token_returns_404(test_client):
    response = test_client.get(URL)

    print(response.json)

    assert response.status_code == 401
