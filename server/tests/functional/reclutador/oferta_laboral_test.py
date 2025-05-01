import allure


@allure.description("Debe devolver status code 400 si no el body está vacio")
def test_crear_oferta_laboral_cuerpo_vacio_returns_400(reclutador_client):
    invalid_data = {}

    response = reclutador_client.post("/api/crear_oferta_laboral", json=invalid_data)

    assert response.status_code == 400
