package voice

import (
	"fmt"
	"log/slog"
	"sync"

	"github.com/pion/interceptor"
	"github.com/pion/interceptor/pkg/stats"
	"github.com/pion/webrtc/v4"

	"github.com/enzyme/server/internal/config"
)

// OnSpeakingFunc is called when a user's speaking state changes.
type OnSpeakingFunc func(channelID, userID string, speaking bool)

// OnICECandidateFunc is called when the server generates an ICE candidate for a peer.
type OnICECandidateFunc func(channelID, userID string, candidate *webrtc.ICECandidate)

// OnRenegotiateFunc is called when SDP renegotiation is needed (participant join/leave).
type OnRenegotiateFunc func(channelID, userID string, offer webrtc.SessionDescription)

// SFU manages WebRTC rooms for voice channels.
type SFU struct {
	rooms  map[string]*Room
	mu     sync.RWMutex
	config config.VoiceConfig
	api    *webrtc.API

	OnSpeaking     OnSpeakingFunc
	OnICECandidate OnICECandidateFunc
	OnRenegotiate  OnRenegotiateFunc
}

func NewSFU(cfg config.VoiceConfig) (*SFU, error) {
	m := &webrtc.MediaEngine{}
	if err := m.RegisterDefaultCodecs(); err != nil {
		return nil, fmt.Errorf("registering codecs: %w", err)
	}

	i := &interceptor.Registry{}
	statsFactory, err := stats.NewInterceptor()
	if err != nil {
		return nil, fmt.Errorf("creating stats interceptor: %w", err)
	}
	i.Add(statsFactory)

	if err := webrtc.RegisterDefaultInterceptors(m, i); err != nil {
		return nil, fmt.Errorf("registering interceptors: %w", err)
	}

	api := webrtc.NewAPI(
		webrtc.WithMediaEngine(m),
		webrtc.WithInterceptorRegistry(i),
	)

	return &SFU{
		rooms:  make(map[string]*Room),
		config: cfg,
		api:    api,
	}, nil
}

// ICEServers returns the ICE server configuration for clients, including
// the embedded TURN server if configured.
func (s *SFU) ICEServers() []webrtc.ICEServer {
	servers := []webrtc.ICEServer{
		{URLs: []string{"stun:stun.l.google.com:19302"}},
	}
	if s.config.TURNExternalIP != "" {
		servers = append(servers, webrtc.ICEServer{
			URLs: []string{
				fmt.Sprintf("turn:%s:%d?transport=udp", s.config.TURNExternalIP, s.config.TURNPort),
			},
			Username:   "enzyme",
			Credential: "enzyme-turn",
		})
	}
	return servers
}

// JoinRoom creates a PeerConnection for the user in the specified channel room
// and returns an SDP offer for the client to answer.
func (s *SFU) JoinRoom(channelID, userID string) (*webrtc.SessionDescription, error) {
	s.mu.Lock()
	room, ok := s.rooms[channelID]
	if !ok {
		room = NewRoom(channelID)
		s.rooms[channelID] = room
	}
	s.mu.Unlock()

	room.mu.Lock()
	defer room.mu.Unlock()

	// Create peer connection
	pc, err := s.api.NewPeerConnection(webrtc.Configuration{
		ICEServers: s.ICEServers(),
	})
	if err != nil {
		return nil, fmt.Errorf("creating peer connection: %w", err)
	}

	peer := &Peer{
		UserID:         userID,
		PeerConnection: pc,
		outputTracks:   make(map[string]*webrtc.TrackLocalStaticRTP),
	}

	// Add a transceiver for receiving audio from this peer
	_, err = pc.AddTransceiverFromKind(webrtc.RTPCodecTypeAudio, webrtc.RTPTransceiverInit{
		Direction: webrtc.RTPTransceiverDirectionRecvonly,
	})
	if err != nil {
		_ = pc.Close()
		return nil, fmt.Errorf("adding audio transceiver: %w", err)
	}

	// For each existing peer, add a send-only track to forward their audio to the new peer
	for existingUserID, existingPeer := range room.Peers {
		if existingPeer.AudioTrack != nil {
			track, err := webrtc.NewTrackLocalStaticRTP(
				existingPeer.AudioTrack.Codec().RTPCodecCapability,
				fmt.Sprintf("audio-%s", existingUserID),
				fmt.Sprintf("stream-%s", existingUserID),
			)
			if err != nil {
				slog.Error("creating local track for existing peer", "error", err)
				continue
			}
			if _, err := pc.AddTrack(track); err != nil {
				slog.Error("adding track to new peer", "error", err)
				continue
			}
			existingPeer.mu.Lock()
			existingPeer.outputTracks[userID] = track
			existingPeer.mu.Unlock()
		}
	}

	// Handle incoming audio track from this peer
	pc.OnTrack(func(remoteTrack *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		peer.AudioTrack = remoteTrack

		// Create output tracks for all other peers in the room
		room.mu.RLock()
		otherPeers := make(map[string]*Peer)
		for uid, p := range room.Peers {
			if uid != userID {
				otherPeers[uid] = p
			}
		}
		room.mu.RUnlock()

		for otherUID, otherPeer := range otherPeers {
			track, err := webrtc.NewTrackLocalStaticRTP(
				remoteTrack.Codec().RTPCodecCapability,
				fmt.Sprintf("audio-%s", userID),
				fmt.Sprintf("stream-%s", userID),
			)
			if err != nil {
				slog.Error("creating local track", "error", err)
				continue
			}
			if _, err := otherPeer.PeerConnection.AddTrack(track); err != nil {
				slog.Error("adding track to peer", "error", err)
				continue
			}
			peer.mu.Lock()
			peer.outputTracks[otherUID] = track
			peer.mu.Unlock()

			// Trigger renegotiation for the other peer
			if s.OnRenegotiate != nil {
				go s.renegotiate(channelID, otherUID, otherPeer)
			}
		}

		// Forward RTP packets to all output tracks
		buf := make([]byte, 1500)
		for {
			n, _, readErr := remoteTrack.Read(buf)
			if readErr != nil {
				return
			}
			peer.mu.Lock()
			for _, outputTrack := range peer.outputTracks {
				if _, writeErr := outputTrack.Write(buf[:n]); writeErr != nil {
					slog.Debug("error writing to output track", "error", writeErr)
				}
			}
			peer.mu.Unlock()
		}
	})

	// Handle ICE candidates
	pc.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate != nil && s.OnICECandidate != nil {
			s.OnICECandidate(channelID, userID, candidate)
		}
	})

	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		slog.Debug("peer connection state changed", "channel", channelID, "user", userID, "state", state)
	})

	room.Peers[userID] = peer

	// Create offer
	offer, err := pc.CreateOffer(nil)
	if err != nil {
		return nil, fmt.Errorf("creating offer: %w", err)
	}
	if err := pc.SetLocalDescription(offer); err != nil {
		return nil, fmt.Errorf("setting local description: %w", err)
	}

	return pc.LocalDescription(), nil
}

// HandleAnswer processes the client's SDP answer.
func (s *SFU) HandleAnswer(channelID, userID string, answer webrtc.SessionDescription) error {
	peer := s.getPeer(channelID, userID)
	if peer == nil {
		return fmt.Errorf("peer not found: %s in %s", userID, channelID)
	}
	return peer.PeerConnection.SetRemoteDescription(answer)
}

// HandleICECandidate adds a remote ICE candidate for a peer.
func (s *SFU) HandleICECandidate(channelID, userID string, candidate webrtc.ICECandidateInit) error {
	peer := s.getPeer(channelID, userID)
	if peer == nil {
		return fmt.Errorf("peer not found: %s in %s", userID, channelID)
	}
	return peer.PeerConnection.AddICECandidate(candidate)
}

// LeaveRoom removes a peer from a room and cleans up its resources.
func (s *SFU) LeaveRoom(channelID, userID string) error {
	s.mu.Lock()
	room, ok := s.rooms[channelID]
	if !ok {
		s.mu.Unlock()
		return nil
	}
	s.mu.Unlock()

	room.mu.Lock()
	peer, ok := room.Peers[userID]
	if !ok {
		room.mu.Unlock()
		return nil
	}
	delete(room.Peers, userID)

	// Remove output tracks from other peers that were forwarding to this peer
	for _, otherPeer := range room.Peers {
		otherPeer.mu.Lock()
		delete(otherPeer.outputTracks, userID)
		otherPeer.mu.Unlock()
	}
	room.mu.Unlock()

	// Close the peer connection
	if err := peer.PeerConnection.Close(); err != nil {
		slog.Error("closing peer connection", "error", err)
	}

	// Clean up empty room
	s.mu.Lock()
	if room.PeerCount() == 0 {
		delete(s.rooms, channelID)
	}
	s.mu.Unlock()

	return nil
}

// Close shuts down all rooms and peer connections.
func (s *SFU) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for channelID, room := range s.rooms {
		room.mu.Lock()
		for _, peer := range room.Peers {
			_ = peer.PeerConnection.Close()
		}
		room.mu.Unlock()
		delete(s.rooms, channelID)
	}
	return nil
}

func (s *SFU) getPeer(channelID, userID string) *Peer {
	s.mu.RLock()
	room, ok := s.rooms[channelID]
	s.mu.RUnlock()
	if !ok {
		return nil
	}
	room.mu.RLock()
	defer room.mu.RUnlock()
	return room.Peers[userID]
}

func (s *SFU) renegotiate(channelID, userID string, peer *Peer) {
	offer, err := peer.PeerConnection.CreateOffer(nil)
	if err != nil {
		slog.Error("creating renegotiation offer", "error", err)
		return
	}
	if err := peer.PeerConnection.SetLocalDescription(offer); err != nil {
		slog.Error("setting local description for renegotiation", "error", err)
		return
	}
	if s.OnRenegotiate != nil {
		s.OnRenegotiate(channelID, userID, *peer.PeerConnection.LocalDescription())
	}
}
