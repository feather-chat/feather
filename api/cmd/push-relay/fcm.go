package main

import (
	"context"
	"fmt"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"google.golang.org/api/option"
)

// FCMClient wraps the Firebase Cloud Messaging client.
type FCMClient struct {
	client *messaging.Client
}

// NewFCMClient initializes an FCM client from a service account credentials file.
func NewFCMClient(credentialsFile string) (*FCMClient, error) {
	ctx := context.Background()
	app, err := firebase.NewApp(ctx, nil, option.WithAuthCredentialsFile(option.ServiceAccount, credentialsFile))
	if err != nil {
		return nil, fmt.Errorf("initializing firebase app: %w", err)
	}

	client, err := app.Messaging(ctx)
	if err != nil {
		return nil, fmt.Errorf("initializing firebase messaging: %w", err)
	}

	return &FCMClient{client: client}, nil
}

// Send dispatches a push notification via FCM. It returns "sent", "invalid_token",
// or "error" along with any error details.
func (f *FCMClient) Send(ctx context.Context, req *NotifyRequest) (string, error) {
	message := &messaging.Message{
		Token: req.DeviceToken,
		Notification: &messaging.Notification{
			Title: req.Title,
			Body:  req.Body,
		},
		Data: req.Data,
		Android: &messaging.AndroidConfig{
			Priority: "high",
			Notification: &messaging.AndroidNotification{
				ChannelID: "messages",
			},
		},
	}

	_, err := f.client.Send(ctx, message)
	if err != nil {
		if messaging.IsInvalidArgument(err) || messaging.IsUnregistered(err) {
			return "invalid_token", nil
		}
		return "error", fmt.Errorf("fcm send: %w", err)
	}

	return "sent", nil
}
