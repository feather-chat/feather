package config

import (
	"strings"
	"testing"
	"time"
)

func validConfig() *Config {
	cfg := Defaults()
	// Satisfy all existing validation rules
	cfg.Auth.BcryptCost = 12
	return cfg
}

func TestDefaults_TLS(t *testing.T) {
	cfg := Defaults()

	if cfg.Server.TLS.Mode != "off" {
		t.Fatalf("expected default TLS mode 'off', got %q", cfg.Server.TLS.Mode)
	}
	if cfg.Server.TLS.CertFile != "" {
		t.Fatalf("expected empty default cert_file, got %q", cfg.Server.TLS.CertFile)
	}
	if cfg.Server.TLS.KeyFile != "" {
		t.Fatalf("expected empty default key_file, got %q", cfg.Server.TLS.KeyFile)
	}
	if cfg.Server.TLS.Auto.Domain != "" {
		t.Fatalf("expected empty default domain, got %q", cfg.Server.TLS.Auto.Domain)
	}
	if cfg.Server.TLS.Auto.Email != "" {
		t.Fatalf("expected empty default email, got %q", cfg.Server.TLS.Auto.Email)
	}
	if cfg.Server.TLS.Auto.CacheDir != "./data/certs" {
		t.Fatalf("expected default cache_dir './data/certs', got %q", cfg.Server.TLS.Auto.CacheDir)
	}
}

func TestValidate_AllowedOrigins_Valid(t *testing.T) {
	cfg := validConfig()
	cfg.Server.AllowedOrigins = []string{"http://localhost:3000", "https://app.example.com"}
	if err := Validate(cfg); err != nil {
		t.Fatalf("valid origins should pass: %v", err)
	}
}

func TestValidate_AllowedOrigins_Empty(t *testing.T) {
	cfg := validConfig()
	cfg.Server.AllowedOrigins = nil
	if err := Validate(cfg); err != nil {
		t.Fatalf("empty origins should pass: %v", err)
	}
}

func TestValidate_AllowedOrigins_NoScheme(t *testing.T) {
	cfg := validConfig()
	cfg.Server.AllowedOrigins = []string{"localhost:3000"}
	err := Validate(cfg)
	if err == nil {
		t.Fatal("expected error for origin without scheme")
	}
	if !strings.Contains(err.Error(), "allowed_origins") {
		t.Fatalf("expected error about allowed_origins, got: %v", err)
	}
}

func TestValidate_AllowedOrigins_EmptyString(t *testing.T) {
	cfg := validConfig()
	cfg.Server.AllowedOrigins = []string{""}
	err := Validate(cfg)
	if err == nil {
		t.Fatal("expected error for empty string origin")
	}
	if !strings.Contains(err.Error(), "allowed_origins") {
		t.Fatalf("expected error about allowed_origins, got: %v", err)
	}
}

func TestValidate_RateLimitDefaults(t *testing.T) {
	cfg := validConfig()
	if err := Validate(cfg); err != nil {
		t.Fatalf("defaults should be valid: %v", err)
	}
}

func TestValidate_RateLimitDisabled(t *testing.T) {
	cfg := validConfig()
	cfg.RateLimit.Enabled = false
	cfg.RateLimit.Login.Limit = 0  // invalid, but should not matter when disabled
	cfg.RateLimit.Login.Window = 0 // invalid, but should not matter when disabled
	if err := Validate(cfg); err != nil {
		t.Fatalf("disabled rate limit should skip validation: %v", err)
	}
}

func TestValidate_RateLimitInvalidLimit(t *testing.T) {
	cfg := validConfig()
	cfg.RateLimit.Login.Limit = 0

	err := Validate(cfg)
	if err == nil {
		t.Fatal("expected error for zero limit")
	}
	if !strings.Contains(err.Error(), "rate_limit.login.limit") {
		t.Fatalf("expected error about login limit, got: %v", err)
	}
}

func TestValidate_RateLimitInvalidWindow(t *testing.T) {
	cfg := validConfig()
	cfg.RateLimit.Register.Window = 500 * time.Millisecond

	err := Validate(cfg)
	if err == nil {
		t.Fatal("expected error for sub-second window")
	}
	if !strings.Contains(err.Error(), "rate_limit.register.window") {
		t.Fatalf("expected error about register window, got: %v", err)
	}
}

func TestValidate_TLSOff(t *testing.T) {
	cfg := validConfig()
	cfg.Server.TLS.Mode = "off"
	if err := Validate(cfg); err != nil {
		t.Fatalf("TLS off should pass: %v", err)
	}
}

func TestValidate_TLSEmpty(t *testing.T) {
	cfg := validConfig()
	cfg.Server.TLS.Mode = ""
	if err := Validate(cfg); err != nil {
		t.Fatalf("TLS empty mode should pass: %v", err)
	}
}

func TestValidate_TLSAutoValid(t *testing.T) {
	cfg := validConfig()
	cfg.Server.TLS.Mode = "auto"
	cfg.Server.TLS.Auto.Domain = "example.com"
	cfg.Server.TLS.Auto.CacheDir = "./data/certs"
	if err := Validate(cfg); err != nil {
		t.Fatalf("TLS auto with domain+cache should pass: %v", err)
	}
}

func TestValidate_TLSAutoMissingDomain(t *testing.T) {
	cfg := validConfig()
	cfg.Server.TLS.Mode = "auto"
	cfg.Server.TLS.Auto.Domain = ""
	cfg.Server.TLS.Auto.CacheDir = "./data/certs"
	err := Validate(cfg)
	if err == nil {
		t.Fatal("expected error for auto mode without domain")
	}
	if !strings.Contains(err.Error(), "auto.domain") {
		t.Fatalf("expected error about auto.domain, got: %v", err)
	}
}

func TestValidate_TLSAutoMissingCacheDir(t *testing.T) {
	cfg := validConfig()
	cfg.Server.TLS.Mode = "auto"
	cfg.Server.TLS.Auto.Domain = "example.com"
	cfg.Server.TLS.Auto.CacheDir = ""
	err := Validate(cfg)
	if err == nil {
		t.Fatal("expected error for auto mode without cache_dir")
	}
	if !strings.Contains(err.Error(), "cache_dir") {
		t.Fatalf("expected error about cache_dir, got: %v", err)
	}
}

func TestValidate_TLSManualValid(t *testing.T) {
	cfg := validConfig()
	cfg.Server.TLS.Mode = "manual"
	cfg.Server.TLS.CertFile = "/path/to/cert.pem"
	cfg.Server.TLS.KeyFile = "/path/to/key.pem"
	if err := Validate(cfg); err != nil {
		t.Fatalf("TLS manual with cert+key should pass: %v", err)
	}
}

func TestValidate_TLSManualMissingCert(t *testing.T) {
	cfg := validConfig()
	cfg.Server.TLS.Mode = "manual"
	cfg.Server.TLS.CertFile = ""
	cfg.Server.TLS.KeyFile = "/path/to/key.pem"
	err := Validate(cfg)
	if err == nil {
		t.Fatal("expected error for manual mode without cert_file")
	}
	if !strings.Contains(err.Error(), "cert_file") {
		t.Fatalf("expected error about cert_file, got: %v", err)
	}
}

func TestValidate_TLSManualMissingKey(t *testing.T) {
	cfg := validConfig()
	cfg.Server.TLS.Mode = "manual"
	cfg.Server.TLS.CertFile = "/path/to/cert.pem"
	cfg.Server.TLS.KeyFile = ""
	err := Validate(cfg)
	if err == nil {
		t.Fatal("expected error for manual mode without key_file")
	}
	if !strings.Contains(err.Error(), "key_file") {
		t.Fatalf("expected error about key_file, got: %v", err)
	}
}

func TestValidate_TLSInvalidMode(t *testing.T) {
	cfg := validConfig()
	cfg.Server.TLS.Mode = "invalid"
	err := Validate(cfg)
	if err == nil {
		t.Fatal("expected error for invalid TLS mode")
	}
	if !strings.Contains(err.Error(), "tls.mode") {
		t.Fatalf("expected error about tls.mode, got: %v", err)
	}
}

func TestValidate_RateLimitMultipleErrors(t *testing.T) {
	cfg := validConfig()
	cfg.RateLimit.Login.Limit = 0
	cfg.RateLimit.ForgotPassword.Window = 0

	err := Validate(cfg)
	if err == nil {
		t.Fatal("expected errors")
	}
	msg := err.Error()
	if !strings.Contains(msg, "rate_limit.login.limit") {
		t.Fatalf("expected login limit error, got: %v", err)
	}
	if !strings.Contains(msg, "rate_limit.forgot_password.window") {
		t.Fatalf("expected forgot_password window error, got: %v", err)
	}
}
