import os
from flask import Flask, redirect, render_template, request, url_for


def create_app() -> Flask:
    app = Flask(__name__, template_folder="templates", static_folder="static")

    app.config.setdefault("API_BASE_URL", os.getenv("API_BASE_URL", "http://localhost:8000/api/v1"))
    app.config.setdefault("FRONTEND_BASE_URL", os.getenv("FRONTEND_BASE_URL", "http://localhost:8080"))

    @app.context_processor
    def inject_globals():
        return {
            "APP_CONFIG": {
                "apiBaseUrl": app.config["API_BASE_URL"],
                "frontendBaseUrl": app.config["FRONTEND_BASE_URL"],
            }
        }

    public_endpoints = {"login", "forgot_password", "reset_password", "register"}

    @app.before_request
    def require_authentication():
        if request.path.startswith("/static/"):
            return None

        endpoint = request.endpoint or ""
        if endpoint in public_endpoints:
            return None

        if request.cookies.get("lagana_session"):
            return None

        return redirect(url_for("login"))

    @app.route("/")
    def index():
        return redirect(url_for("dashboard"))

    @app.route("/login")
    def login():
        return render_template("auth/login.html")

    @app.route("/forgot-password")
    def forgot_password():
        return render_template("auth/forgot.html")

    @app.route("/reset-password")
    def reset_password():
        return render_template("auth/reset.html")

    @app.route("/register")
    def register():
        return render_template("auth/register.html")

    @app.route("/dashboard")
    def dashboard():
        return render_template("dashboard.html")

    @app.route("/players")
    def players_list():
        return render_template("players/list.html")

    @app.route("/players/new")
    def player_create():
        return render_template("players/form.html", mode="create")

    @app.route("/players/<int:player_id>/edit")
    def player_edit(player_id: int):
        return render_template("players/form.html", mode="edit", player_id=player_id)

    @app.route("/lessons")
    def lessons_list():
        return render_template("lessons/list.html")

    @app.route("/lessons/new")
    def lesson_create():
        return render_template("lessons/form.html", mode="create")

    @app.route("/lessons/<int:lesson_id>/edit")
    def lesson_edit(lesson_id: int):
        return render_template("lessons/form.html", mode="edit", lesson_id=lesson_id)

    @app.route("/invoices")
    def invoices_list():
        return render_template("invoices/list.html")

    @app.route("/invoices/<int:invoice_id>")
    def invoices_detail(invoice_id: int):
        return render_template("invoices/detail.html", invoice_id=invoice_id)

    @app.route("/invoices/wizard/period")
    def invoices_wizard_period():
        return render_template("invoices/wizard_period.html")

    @app.route("/invoices/wizard/select")
    def invoices_wizard_select():
        return render_template("invoices/wizard_select.html")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
