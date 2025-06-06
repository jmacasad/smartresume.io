import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
import os

def init_sentry(app):
    SENTRY_DSN = os.getenv("SENTRY_DSN")
    if not SENTRY_DSN:
        app.logger.warning("Sentry DSN not configured.")
        return

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[FlaskIntegration()],
        traces_sample_rate=0.5,
        send_default_pii=True
    )
    app.logger.info("Sentry initialized")
