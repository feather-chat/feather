package handler

import (
	"context"
	"errors"
	"strings"

	"github.com/feather/api/internal/openapi"
	"github.com/feather/api/internal/user"
)

// GetUser returns a user's public profile
func (h *Handler) GetUser(ctx context.Context, request openapi.GetUserRequestObject) (openapi.GetUserResponseObject, error) {
	userID := h.getUserID(ctx)
	if userID == "" {
		return openapi.GetUser401JSONResponse{
			UnauthorizedJSONResponse: openapi.UnauthorizedJSONResponse(newErrorResponse(ErrCodeNotAuthenticated, "Not authenticated")),
		}, nil
	}

	u, err := h.userRepo.GetByID(ctx, request.Id)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			return openapi.GetUser404JSONResponse{
				NotFoundJSONResponse: openapi.NotFoundJSONResponse(newErrorResponse(ErrCodeNotFound, "User not found")),
			}, nil
		}
		return nil, err
	}

	return openapi.GetUser200JSONResponse{
		User: &openapi.UserProfile{
			Id:          u.ID,
			DisplayName: u.DisplayName,
			AvatarUrl:   u.AvatarURL,
			Status:      u.Status,
			CreatedAt:   u.CreatedAt,
		},
	}, nil
}

// UpdateProfile updates the current user's profile
func (h *Handler) UpdateProfile(ctx context.Context, request openapi.UpdateProfileRequestObject) (openapi.UpdateProfileResponseObject, error) {
	userID := h.getUserID(ctx)
	if userID == "" {
		return openapi.UpdateProfile401JSONResponse{
			UnauthorizedJSONResponse: openapi.UnauthorizedJSONResponse(newErrorResponse(ErrCodeNotAuthenticated, "Not authenticated")),
		}, nil
	}

	u, err := h.userRepo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			return openapi.UpdateProfile401JSONResponse{
				UnauthorizedJSONResponse: openapi.UnauthorizedJSONResponse(newErrorResponse(ErrCodeNotAuthenticated, "Not authenticated")),
			}, nil
		}
		return nil, err
	}

	// Update fields if provided
	if request.Body.DisplayName != nil {
		displayName := strings.TrimSpace(*request.Body.DisplayName)
		if displayName == "" {
			return openapi.UpdateProfile400JSONResponse{
				BadRequestJSONResponse: openapi.BadRequestJSONResponse(newErrorResponse(ErrCodeValidationError, "Display name cannot be empty")),
			}, nil
		}
		u.DisplayName = displayName
	}

	if request.Body.AvatarUrl != nil {
		avatarURL := strings.TrimSpace(*request.Body.AvatarUrl)
		if avatarURL == "" {
			u.AvatarURL = nil
		} else {
			u.AvatarURL = &avatarURL
		}
	}

	if err := h.userRepo.Update(ctx, u); err != nil {
		return nil, err
	}

	return openapi.UpdateProfile200JSONResponse{
		User: ptr(userToAPI(u)),
	}, nil
}

// ptr returns a pointer to the given value
func ptr[T any](v T) *T {
	return &v
}
