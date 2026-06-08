from supabase import create_client, Client
from flask import current_app
import functools

_client: Client = None

def get_supabase() -> Client:
    global _client
    if _client is None:
        url = current_app.config["SUPABASE_URL"]
        key = current_app.config["SUPABASE_KEY"]
        _client = create_client(url, key)
    return _client
