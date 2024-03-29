package chirp

import (
	"os"
	"testing"

	"github.com/yomorun/yomo/core/frame"
	"yomo.run/prscd/util"
)

// NewMockConnection creates a new WebSocketConnection
func NewMockConnection(sid string) Connection {
	return &MockConnection{
		sid: sid,
	}
}

// MockConnection is a WebSocket connection
type MockConnection struct {
	sid string
}

// RemoteAddr returns the client network address.
func (c *MockConnection) RemoteAddr() string {
	return c.sid
}

// Write the data to the connection
func (c *MockConnection) Write(msg []byte) error {
	return nil
}

// SenderMock implement yomo.Source interface
type SenderMock struct{}

func (s *SenderMock) Close() error {
	return nil
}

func (s *SenderMock) Connect() error {
	return nil
}

func (s *SenderMock) Write(tag frame.Tag, data []byte) error {
	return nil
}

func (s *SenderMock) SetErrorHandler(fn func(err error)) {
}

func (s *SenderMock) SetReceiveHandler(fn func(tag frame.Tag, data []byte)) {
}

func (s *SenderMock) Broadcast(tag uint32, data []byte) error {
	return nil
}

func (s *SenderMock) SetDataTag(tag frame.Tag) {}

var channelName, peerName string
var appID = "test_appid"
var n = GetOrCreateRealm(appID, os.Getenv("YOMO_CREDENTIAL"))

func init() {
	// mock YoMo Source
	n.sndr = &SenderMock{}

	channelName = "test_channel"
	peerName = "test_peer"

	AuthUserAndGetYoMoCredential = func(publicKey string) (appID, credential string, ok bool) {
		return "YOMO_APP", os.Getenv("YOMO_CREDENTIAL"), true
	}

	// error level
	util.Log.SetLogLevel(2)
}

func Test_node_AddPeer(t *testing.T) {
	peer := n.AddPeer(NewMockConnection(peerName), channelName)
	peer.Join(channelName)

	assert(t, peer != nil, "peer should not be nil")
	assert(t, peer.realm.id == appID, "peer.AppID should be %s, but got %s", appID, peer.realm.id)
	assert(t, peer.Channels != nil, "peer.Channels should not be nil")
	assert(t, len(peer.Channels) == 1, "len(peer.Channels) should be 1, but got %d", len(peer.Channels))
	assert(t, peer.Channels[channelName] != nil, "peer.Channels[%s] should not be nil", channelName)
	ch := n.FindChannel(channelName)
	assert(t, ch != nil, "node.cdic[%s] should not be nil", appID+"|"+channelName)
	assert(t, ch.getLen() > 0, "len(node.cdic[%s].peers) should > 0", appID+"|"+channelName)
	p, ok := n.pdic.Load(peerName)
	assert(t, ok, "node.pdic[%s] should not be nil", appID+"|"+peerName)
	assert(t, p.(*Peer).Sid == peerName, "node.pdic[%s] should not be nil", appID+"|"+peerName)

	peer.Leave(channelName)
	assert(t, len(peer.Channels) == 0, "len(peer.Channels) should be 1, but got %d", len(peer.Channels))
	ch = n.FindChannel(channelName)
	assert(t, ch != nil, "node.cdic[%s] should not be nil", appID+"|"+channelName)
	assert(t, ch.getLen() == 0, "len(node.cdic[%s].pdic) should be 0, but got %d", appID+"|"+channelName, ch.getLen())
	p, ok = n.pdic.Load(peerName)
	assert(t, ok, "node.pdic[%s] should not be nil", appID+"|"+peerName)
	assert(t, p.(*Peer).Sid == peerName, "node.pdic[%s] should not be nil", appID+"|"+peerName)

	peer.Disconnect()
	ch = n.FindChannel(channelName)
	assert(t, ch != nil, "node.cdic[%s] should not be nil", appID+"|"+channelName)
	assert(t, ch.getLen() == 0, "len(node.cdic[%s].pdic) should be 0, but got %d", appID+"|"+channelName, ch.getLen())
	p, ok = n.pdic.Load(peerName)
	assert(t, !ok, "node.pdic[%s] should be nil", appID+"|"+peerName)
	assert(t, p == nil, "node.pdic[%s] should not be nil", appID+"|"+peerName)
}

func assert(t *testing.T, condition bool, format string, args ...any) {
	if !condition {
		t.Errorf(format, args...)
	}
}

func BenchmarkPeerJoinAndLeave(b *testing.B) {
	for i := 0; i < b.N; i++ {
		peer := n.AddPeer(NewMockConnection(peerName), channelName)
		peer.Join(channelName)
		peer.Leave(channelName)
		peer.Disconnect()
	}
}

func Test_node_AuthUser(t *testing.T) {
	var wantAppID = "YOMO_APP"
	gotAppID, _, gotOk := AuthUserAndGetYoMoCredential(wantAppID)
	if gotAppID != wantAppID {
		t.Errorf("node.AuthUser() gotAppID = %v, want %v", gotAppID, wantAppID)
	}
	if gotOk != true {
		t.Errorf("node.AuthUser() gotOk = %v, want %v", gotOk, true)
	}
}
