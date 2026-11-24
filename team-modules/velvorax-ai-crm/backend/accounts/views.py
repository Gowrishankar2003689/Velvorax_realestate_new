from django.shortcuts import render

import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect


@ensure_csrf_cookie
def csrf_token_view(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_POST
@csrf_protect
def login_view(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"error": "Invalid JSON request."},
            status=400,
        )

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return JsonResponse(
            {"error": "Username and password are required."},
            status=400,
        )

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None:
        return JsonResponse(
            {"error": "Invalid username or password."},
            status=401,
        )

    login(request, user)

    return JsonResponse({
        "message": "Login successful.",
        "username": user.get_username(),
    })


@require_POST
@csrf_protect
def logout_view(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "You are not logged in."},
            status=401,
        )

    logout(request)
    return JsonResponse({"message": "Logout successful."})


def current_user_view(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"authenticated": False},
            status=401,
        )

    return JsonResponse({
        "authenticated": True,
        "username": request.user.get_username(),
        "is_staff": request.user.is_staff,
    })