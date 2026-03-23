package main

import (
	"errors"
	"strings"
)

// NotifyRequest is the payload received from Enzyme servers.
type NotifyRequest struct {
	DeviceToken string            `json:"device_token"`
	Platform    string            `json:"platform"` // "fcm" or "apns"
	Title       string            `json:"title"`
	Body        string            `json:"body"`
	Data        map[string]string `json:"data"` // channel_id, message_id, workspace_id, server_url
}

// NotifyResponse is returned to the calling Enzyme server.
type NotifyResponse struct {
	Status string `json:"status"` // "sent", "invalid_token", "error"
	Error  string `json:"error,omitempty"`
}

// maxRequestBodySize is the maximum allowed request body (4 KB).
const maxRequestBodySize = 4 * 1024

func (r *NotifyRequest) Validate() error {
	if strings.TrimSpace(r.DeviceToken) == "" {
		return errors.New("device_token is required")
	}
	if r.Platform != "fcm" && r.Platform != "apns" {
		return errors.New("platform must be \"fcm\" or \"apns\"")
	}
	if strings.TrimSpace(r.Title) == "" {
		return errors.New("title is required")
	}
	return nil
}
