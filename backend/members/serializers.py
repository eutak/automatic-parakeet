from rest_framework import serializers
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from .models import CustomUser

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from rest_framework.exceptions import PermissionDenied

class CustomUserSerializer(serializers.HyperlinkedModelSerializer):
    can_delete_user = serializers.BooleanField(required=False)

    class Meta:
        model = CustomUser
        fields = ['url', 'username', 'first_name', 'last_name', 'email', 'phone_number', 'can_delete_user']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Add the computed value of can_delete_user to the output

        content_type = ContentType.objects.get_for_model(CustomUser)
        delete_permission = Permission.objects.get(codename='delete_customuser', content_type=content_type)

        # Check if the permission exists in instance.user_permissions
        has_delete_permission = instance.user_permissions.filter(pk=delete_permission.pk).exists()

        representation['can_delete_user'] = has_delete_permission
        return representation

    def _check_delete_permission(self, user):
        if not user.has_perm('members.delete_customuser'):
            raise PermissionDenied("You do not have permission to modify the admin attribute.")

    def create(self, validated_data):
        request_user = self.context['request'].user  # Get the current user from the request context
        can_delete_user = validated_data.pop('can_delete_user', None)

        # Check if the current user has permission to set this
        if can_delete_user:
            self._check_delete_permission(request_user)

        # Create the user object with the remaining validated data
        user = CustomUser.objects.create(**validated_data)

        # Handle the can_delete_user permission after user creation
        if can_delete_user is not None:
            content_type = ContentType.objects.get_for_model(CustomUser)
            permission = Permission.objects.get(codename='delete_customuser', content_type=content_type)
            
            if can_delete_user:
                user.user_permissions.add(permission)
            else:
                user.user_permissions.remove(permission)

        user.save()
        return user

    def update(self, instance, validated_data):
        request_user = self.context['request'].user  # Get the current user from the request context
        can_delete_user = validated_data.pop('can_delete_user', None)

        # Check if the current user has permission to modify this
        if can_delete_user != instance.has_perm('members.delete_customuser'):
            self._check_delete_permission(request_user)

        # Update user permission based on can_delete_user value before updating the instance
        content_type = ContentType.objects.get_for_model(CustomUser)
        permission = Permission.objects.get(codename='delete_customuser', content_type=content_type)
        
        if can_delete_user is not None:
            if can_delete_user:
                instance.user_permissions.add(permission)
            else:
                instance.user_permissions.remove(permission)

        # Now that permissions are updated, proceed to update other fields as usual
        instance = super().update(instance, validated_data)

        instance.save()
        return instance

