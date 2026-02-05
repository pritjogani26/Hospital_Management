# backend\doctor\views.py
from django.http import HttpRequest
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.authentication import JWTAuthentication
from .serializers import (
    DoctorListSerializer,
    GenderSerializer,
    QualificationSerializer,
    RegisterDoctorSerializer,
    UpdateDoctorSerializer,
    DoctorProfileSerializer,
)
from .doctor_service.db import fetch_one, fetch_all
import os
from django.conf import settings

from service_app.image_process import get_image_path


class AddDoctor(generics.GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = RegisterDoctorSerializer

    def post(self, request: HttpRequest):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            image_path = get_image_path(data, request, name="doctor")

            result = fetch_one(
                """
                SELECT register_doctor(%s,%s,%s,%s,%s,%s,%s,%s,%s) AS doctor_id
                """,
                [
                    data["full_name"],
                    data["experience_years"],
                    data.get("gender_id"),
                    data["phone_number"],
                    data.get("email"),
                    data.get("consultation_fee"),
                    image_path,
                    data.get("joining_date"),
                    data["qualification_ids"],
                ],
            )

            doctor_id = result["doctor_id"]

            if doctor_id == -1:
                return Response(
                    {"error": "Email or phone number already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if doctor_id == -2:
                return Response(
                    {"error": "Invalid gender or qualification"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if doctor_id == -99:
                return Response(
                    {"error": "Unable to create doctor"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {"message": "Doctor created successfully", "doctor_id": doctor_id},
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DoctorProfile(generics.GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = DoctorProfileSerializer

    def get(self, request, doctor_id: int):
        result = fetch_one(
            "SELECT * FROM get_doctor_profile(%s)",
            [doctor_id],
        )

        if not result:
            return Response(
                {"error": "Doctor not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(result)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GenderList(generics.GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = GenderSerializer

    def get(self, request: HttpRequest):
        try:
            rows = fetch_all("SELECT * FROM get_genders()", [])
            # print(rows)
            serializer = self.get_serializer(rows, many=True)
            # print(serializer.data)
            return Response(serializer.data or [], status=status.HTTP_200_OK)
        except Exception as e:
            print(str(e))
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class QualificationList(generics.GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = QualificationSerializer

    def get(self, request: HttpRequest):
        try:
            rows = fetch_all("SELECT * FROM get_qualifications()", [])
            serializer = self.get_serializer(rows, many=True)
            return Response(serializer.data or [], status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DoctoreList(generics.GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = DoctorListSerializer

    def get(self, request: HttpRequest):
        try:
            result = fetch_all("SELECT * FROM get_doctors_list()", [])
        except Exception as e:
            print(f"\nError : {e}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if not result:
            return Response([], status=status.HTTP_200_OK)

        serializer = self.get_serializer(result, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateDoctor(generics.GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = UpdateDoctorSerializer

    def put(self, request, doctor_id: int):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            image_path = get_image_path(data, request, name="doctor")

            result = fetch_one(
                """
                SELECT update_doctor_profile(%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                [
                    doctor_id,
                    data["full_name"],
                    data["experience_years"],
                    data.get("gender_id"),
                    data["phone_number"],
                    data.get("email"),
                    data.get("consultation_fee"),
                    image_path,
                    data["qualification_ids"],
                ],
            )

            if not result["update_doctor_profile"]:
                return Response(
                    {"error": "Doctor not found or update failed"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {"message": "Doctor profile updated successfully"},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
