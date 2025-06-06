from flask import jsonify
import traceback
import logging

def register_error_handlers(app):
    logger = logging.getLogger(__name__)

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad Request", "message": str(error)}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not Found", "message": str(error)}), 404

    @app.errorhandler(500)
    def server_error(error):
        # Log full stack trace for internal errors
        logger.exception("Internal Server Error: %s", error)
        return jsonify({
            "error": "Internal Server Error",
            "message": "Something went wrong. Please try again later."
        }), 500

    @app.errorhandler(Exception)
    def handle_unexpected_exception(error):
        logger.exception("Unexpected Exception: %s", error)
        return jsonify({
            "error": "Unexpected Error",
            "message": str(error),
            "type": type(error).__name__
        }), 500
