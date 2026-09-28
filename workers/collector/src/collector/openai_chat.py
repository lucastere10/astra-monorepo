"""chat.completions helper that drops params a model rejects.

Newer models (gpt-5.x) only accept the default temperature and 400 if we
send 0.2/0.5. Retry without that field so one OPENAI_MODEL works everywhere.
"""

from __future__ import annotations

from typing import Any

_UNSUPPORTED_CODES = {"unsupported_value", "unsupported_parameter"}
_MAX_PARAM_DROPS = 5


def _unsupported_param(exc: BaseException) -> str | None:
    code = getattr(exc, "code", None)
    param = getattr(exc, "param", None)
    body = getattr(exc, "body", None)
    if isinstance(body, dict):
        err = body.get("error")
        if isinstance(err, dict):
            code = code or err.get("code")
            param = param or err.get("param")
    if code in _UNSUPPORTED_CODES and isinstance(param, str) and param:
        return param
    return None


def _omit_unsupported_sampling(request: dict[str, Any]) -> None:
    model = request.get("model")
    if isinstance(model, str) and model.startswith("gpt-5"):
        request.pop("temperature", None)


def create_chat_completion(client: Any, **params: Any) -> Any:
    request = dict(params)
    _omit_unsupported_sampling(request)
    last_error: BaseException | None = None
    for _ in range(_MAX_PARAM_DROPS):
        try:
            return client.chat.completions.create(**request)
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            param = _unsupported_param(exc)
            if not param or param not in request:
                raise
            print(
                f"[openai_chat] dropping unsupported {param!r} "
                f"for {request.get('model')}"
            )
            request.pop(param, None)
    if last_error:
        raise last_error
    raise RuntimeError("OpenAI chat completion failed after dropping optional params")
