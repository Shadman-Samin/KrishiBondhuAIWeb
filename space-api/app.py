# KrishiBondhu API Space — FastAPI backend served on the free ZeroGPU tier.
#
# Two constraints shape this file:
#   1. ZeroGPU only reports its @spaces.GPU functions to the runtime from
#      inside a Gradio launch(), otherwise the Space dies with
#      "No @spaces.GPU function detected during startup".
#   2. Gradio 6 serves its own SPA as the front door (it registers GET / and
#      GET /{page} HTML routes), so the REST API cannot be mounted inside the
#      Gradio app.
#
# So Gradio is launched privately on 127.0.0.1:7861 purely for the ZeroGPU
# handshake, while uvicorn serves the app-compat REST backend (api/server.py)
# on the public port 7860. Gradio reads GRADIO_SERVER_* at import time, and HF
# exports GRADIO_SERVER_PORT=7860, so the port/env must be forced *before*
# `import gradio`. YOLO predict is wrapped with @spaces.GPU and falls back to
# plain CPU inference on quota/GPU errors.
import os

os.environ["GRADIO_SERVER_NAME"] = "127.0.0.1"  # read by gradio.http_server at import
os.environ["GRADIO_SERVER_PORT"] = "7861"

import spaces  # noqa: F401,E402  (must be the first import on ZeroGPU)

import threading  # noqa: E402

import gradio as gr  # noqa: E402
import uvicorn  # noqa: E402
from fastapi.responses import HTMLResponse  # noqa: E402
from starlette.routing import Route  # noqa: E402

from api import server as srv  # noqa: E402

_orig_get_model = srv.get_model


@spaces.GPU(duration=30)
def _gpu_predict(*args, **kwargs):
    """GPU entry point for the REST path (called from _GPUModelProxy)."""
    return _orig_get_model().predict(*args, **kwargs)


@spaces.GPU(duration=30)
def _gpu_selftest():
    """Registered as a Gradio event so ZeroGPU's startup scan finds a GPU
    function (required, or the Space refuses to start)."""
    return "ZeroGPU ready — REST endpoints live on this Space."


class _GPUModelProxy:
    """Wraps srv.get_model(): loads the model plain first (CPU-emulation safe,
    same as the demo Space), runs .predict on ZeroGPU, and falls back to plain
    inference on any quota/GPU error."""

    def __init__(self, loader):
        object.__setattr__(self, "_loader", loader)

    def predict(self, *args, **kwargs):
        loader = object.__getattribute__(self, "_loader")
        loader()
        try:
            return _gpu_predict(*args, **kwargs)
        except Exception:
            return loader().predict(*args, **kwargs)

    def __getattr__(self, name):
        loader = object.__getattribute__(self, "_loader")
        return getattr(loader(), name)


srv.get_model = lambda: _GPUModelProxy(_orig_get_model)

with gr.Blocks(title="KrishiBondhu API — App Backend") as blocks:
    gr.Markdown(
        "App-compat REST backend (`docs/API_FOR_APP.md`). Endpoints: "
        "`/predict`, `/disease/detect`, `/assistant/chat`, `/market/prices`, `/weather/forecast`, `/health`."
    )
    _selftest_out = gr.Textbox(label="ZeroGPU self-test", interactive=False)
    gr.Button("Run GPU self-test").click(_gpu_selftest, outputs=_selftest_out)


def _landing_page(_request):
    return HTMLResponse(
        "<h1>KrishiBondhu AI — App Backend</h1>"
        "<p>REST API is live. Try <a href='/health'>/health</a>, "
        "<a href='/docs'>/docs</a> (OpenAPI), <code>/disease/detect</code>, "
        "<code>/assistant/chat</code>, <code>/market/prices</code>, "
        "<code>/weather/forecast</code>.</p>"
        "<p>See <code>docs/API_FOR_APP.md</code> in the project repo.</p>"
    )


# server.py registers a GET catch-all ("/{path:path}") for static/SSR proxying;
# put the landing page in front of it so "/" is not swallowed.
srv.app.router.routes.insert(0, Route("/", _landing_page))


if __name__ == "__main__":
    def _zerogpu_launch():
        try:
            blocks.launch(prevent_thread_lock=True, quiet=True)
        except Exception as e:  # pragma: no cover
            print(f"ZeroGPU launch() failed (API keeps serving, GPU may fall back to CPU): {e}")

    threading.Thread(target=_zerogpu_launch, daemon=True).start()
    uvicorn.run(srv.app, host="0.0.0.0", port=7860, workers=1)
