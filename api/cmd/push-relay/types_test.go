package main

import (
	"testing"
)

func TestNotifyRequest_Validate(t *testing.T) {
	tests := []struct {
		name    string
		req     NotifyRequest
		wantErr string
	}{
		{
			name:    "valid fcm request",
			req:     NotifyRequest{DeviceToken: "tok123", Platform: "fcm", Title: "Hello"},
			wantErr: "",
		},
		{
			name:    "valid apns request",
			req:     NotifyRequest{DeviceToken: "tok123", Platform: "apns", Title: "Hello"},
			wantErr: "",
		},
		{
			name:    "missing device_token",
			req:     NotifyRequest{Platform: "fcm", Title: "Hello"},
			wantErr: "device_token is required",
		},
		{
			name:    "whitespace device_token",
			req:     NotifyRequest{DeviceToken: "   ", Platform: "fcm", Title: "Hello"},
			wantErr: "device_token is required",
		},
		{
			name:    "invalid platform",
			req:     NotifyRequest{DeviceToken: "tok123", Platform: "web", Title: "Hello"},
			wantErr: `platform must be "fcm" or "apns"`,
		},
		{
			name:    "empty platform",
			req:     NotifyRequest{DeviceToken: "tok123", Title: "Hello"},
			wantErr: `platform must be "fcm" or "apns"`,
		},
		{
			name:    "missing title",
			req:     NotifyRequest{DeviceToken: "tok123", Platform: "fcm"},
			wantErr: "title is required",
		},
		{
			name:    "whitespace title",
			req:     NotifyRequest{DeviceToken: "tok123", Platform: "fcm", Title: "  "},
			wantErr: "title is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if tt.wantErr == "" {
				if err != nil {
					t.Errorf("expected no error, got %v", err)
				}
				return
			}
			if err == nil {
				t.Errorf("expected error %q, got nil", tt.wantErr)
				return
			}
			if err.Error() != tt.wantErr {
				t.Errorf("expected error %q, got %q", tt.wantErr, err.Error())
			}
		})
	}
}
