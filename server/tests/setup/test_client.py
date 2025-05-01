import pytest
from main import app


@pytest.fixture(scope="module")
def test_client():
    """Provides an application context for the tests."""
    with app.test_client() as testing_client:
        with app.app_context():
            yield testing_client
