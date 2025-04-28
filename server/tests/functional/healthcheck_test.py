def test_index_route(test_client):
    response = test_client.get("/")

    assert response.status_code == 200
    assert response.data.decode("utf-8") == "Hello, World!"
