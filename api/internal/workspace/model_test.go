package workspace

import "testing"

func TestCanManageMembers(t *testing.T) {
	tests := []struct {
		name string
		role string
		want bool
	}{
		{"owner can manage", RoleOwner, true},
		{"admin can manage", RoleAdmin, true},
		{"member cannot manage", RoleMember, false},
		{"guest cannot manage", RoleGuest, false},
		{"invalid role cannot manage", "invalid", false},
		{"empty role cannot manage", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := CanManageMembers(tt.role); got != tt.want {
				t.Errorf("CanManageMembers(%q) = %v, want %v", tt.role, got, tt.want)
			}
		})
	}
}

func TestCanChangeRole(t *testing.T) {
	tests := []struct {
		name string
		role string
		want bool
	}{
		{"owner can change", RoleOwner, true},
		{"admin can change", RoleAdmin, true},
		{"member cannot change", RoleMember, false},
		{"guest cannot change", RoleGuest, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := CanChangeRole(tt.role); got != tt.want {
				t.Errorf("CanChangeRole(%q) = %v, want %v", tt.role, got, tt.want)
			}
		})
	}
}

func TestCanDeleteWorkspace(t *testing.T) {
	tests := []struct {
		name string
		role string
		want bool
	}{
		{"owner can delete", RoleOwner, true},
		{"admin cannot delete", RoleAdmin, false},
		{"member cannot delete", RoleMember, false},
		{"guest cannot delete", RoleGuest, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := CanDeleteWorkspace(tt.role); got != tt.want {
				t.Errorf("CanDeleteWorkspace(%q) = %v, want %v", tt.role, got, tt.want)
			}
		})
	}
}

func TestCanCreateChannels(t *testing.T) {
	tests := []struct {
		name string
		role string
		want bool
	}{
		{"owner can create", RoleOwner, true},
		{"admin can create", RoleAdmin, true},
		{"member can create", RoleMember, true},
		{"guest cannot create", RoleGuest, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := CanCreateChannels(tt.role); got != tt.want {
				t.Errorf("CanCreateChannels(%q) = %v, want %v", tt.role, got, tt.want)
			}
		})
	}
}

func TestRoleRank(t *testing.T) {
	tests := []struct {
		name string
		role string
		want int
	}{
		{"owner has highest rank", RoleOwner, 4},
		{"admin has second highest", RoleAdmin, 3},
		{"member has third highest", RoleMember, 2},
		{"guest has lowest valid rank", RoleGuest, 1},
		{"invalid role has zero rank", "invalid", 0},
		{"empty role has zero rank", "", 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := RoleRank(tt.role); got != tt.want {
				t.Errorf("RoleRank(%q) = %v, want %v", tt.role, got, tt.want)
			}
		})
	}
}

func TestRoleRank_Ordering(t *testing.T) {
	// Verify that role ranks are properly ordered
	if RoleRank(RoleOwner) <= RoleRank(RoleAdmin) {
		t.Error("owner should rank higher than admin")
	}
	if RoleRank(RoleAdmin) <= RoleRank(RoleMember) {
		t.Error("admin should rank higher than member")
	}
	if RoleRank(RoleMember) <= RoleRank(RoleGuest) {
		t.Error("member should rank higher than guest")
	}
	if RoleRank(RoleGuest) <= RoleRank("invalid") {
		t.Error("guest should rank higher than invalid")
	}
}
