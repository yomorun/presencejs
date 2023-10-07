package chirp

import (
	"context"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/vmihailenco/msgpack/v5"
	"github.com/yomorun/psig"
	"github.com/yomorun/yomo"
	"github.com/yomorun/yomo/pkg/trace"
	"github.com/yomorun/yomo/serverless"
	"yomo.run/prscd/util"
)

var log = util.Log

const (
	// Endpoint is the base path of service
	Endpoint string = "/v1"
)

var allRealms sync.Map

func GetOrCreateRealm(appID string) (realm *node) {
	log.Debug("get or create realm: %s", appID)
	res, ok := allRealms.LoadOrStore(appID, &node{
		MeshID: os.Getenv("MESH_ID"),
		id:     appID,
	})

	if !ok {
		log.Debug("create realm: %s", appID)
		// connect to yomo zipper when created
		res.(*node).ConnectToYoMo()
	}

	return res.(*node)
}

// TODO: can get credential used to connect to YoMo from db or config file or something else.
func getYoMoCredential(appID string) string {
	return os.Getenv("YOMO_CREDENTIAL")
}

type node struct {
	id     string              // id is the unique id of this node
	cdic   sync.Map            // all channels on this node
	pdic   sync.Map            // all peers on this node
	Env    string              // Env describes the environment of this node, e.g. "dev", "prod"
	MeshID string              // MeshID describes the id of this node
	sndr   yomo.Source         // the yomo source used to send data to the geo-distributed network which built by yomo
	rcvr   yomo.StreamFunction // the yomo stream function used to receive data from the geo-distributed network which built by yomo
}

// AuthUser is used by prscd authentication
func AuthUser(publicKey string) (appID string, ok bool) {
	log.Info("Node| auth_user: publicKey=%s", publicKey)
	// return "YOMO_APP", true
	return publicKey, true
}

// AddPeer add peer to channel named `cid` on this node.
func (n *node) AddPeer(conn Connection, cid string) *Peer {
	log.Info("[%s] node.add_peer: %s", conn.RemoteAddr(), cid)
	peer := &Peer{
		Sid:      conn.RemoteAddr(),
		Cid:      cid,
		Channels: make(map[string]*Channel),
		conn:     conn,
		realm:    n,
	}

	n.pdic.Store(peer.Sid, peer)

	return peer
}

// RemovePeer remove peer on this node.
func (n *node) RemovePeer(pid string) {
	log.Info("[%s] node.remove_peer", pid)
	n.pdic.Delete(pid)
}

// // getIDOnNode get the unique id of peer or channel on this node.
// func (n *node) getIDOnNode(name string) string {
// 	return name
// }

// GetOrCreateChannel get or create channel on this node.
func (n *node) GetOrAddChannel(name string) *Channel {
	channel, ok := n.cdic.LoadOrStore(name, &Channel{
		UniqID: name,
		realm:  n,
	})

	if !ok {
		log.Info("create channel: %s", name)
	}

	return channel.(*Channel)
}

// FindChannel returns the channel on this node by name.
func (n *node) FindChannel(name string) *Channel {
	ch, ok := n.cdic.Load(name)
	if !ok {
		log.Debug("channel not found: %s", name)
		return nil
	}
	return ch.(*Channel)
}

// ConnectToYoMo connect this node to the geo-distributed network which built by yomo.
func (n *node) ConnectToYoMo() error {
	// YOMO_ZIPPER env indicates the endpoint of YoMo Zipper to connect
	log.Debug("[Realm:%s]connect to YoMo Zipper: %s", n.id, os.Getenv("YOMO_ZIPPER"))

	// add open tracing
	tp, shutdown, err := trace.NewTracerProviderWithJaeger("prscd")
	if err == nil {
		log.Info("[%s] 🛰 trace enabled", "prscd")
	}
	defer shutdown(context.Background())

	// sndr is sender to send data to other prscd nodes by YoMo
	sndr := yomo.NewSource(
		os.Getenv("YOMO_SNDR_NAME")+"-"+n.id,
		os.Getenv("YOMO_ZIPPER"),
		yomo.WithCredential(getYoMoCredential(n.id)),
		yomo.WithTracerProvider(tp),
	)

	// rcvr is receiver to receive data from other prscd nodes by YoMo
	rcvr := yomo.NewStreamFunction(
		os.Getenv("YOMO_RCVR_NAME")+"-"+n.id,
		os.Getenv("YOMO_ZIPPER"),
		yomo.WithSfnCredential(getYoMoCredential(n.id)),
		yomo.WithSfnTracerProvider(tp),
	)

	sndr.SetErrorHandler(func(err error) {
		log.Error("sndr error: %+v", err)
	})

	rcvr.SetErrorHandler(func(err error) {
		log.Error("rcvr error: %+v", err)
	})

	// connect yomo source to zipper
	err = sndr.Connect()
	if err != nil {
		return err
	}

	sfnHandler := func(ctx serverless.Context) {
		var sig *psig.Signalling
		err := msgpack.Unmarshal(ctx.Data(), &sig)
		if err != nil {
			log.Error("Read from YoMo error: %v, msg=%# x, string(msg)=%s", err, ctx.Data(), ctx.Data())
		}
		log.Debug("\033[32m[\u21CA\u21CA]\t%s\033[36m", sig)

		if sig.AppID != n.id {
			log.Debug("//////////ignore message from other app: %s", sig.AppID)
			return
		}

		channel := n.FindChannel(sig.Channel)
		if channel != nil {
			channel.Dispatch(sig)
			log.Debug("[\u21CA]\t dispatched to %s", sig.Cid)
		} else {
			log.Debug("[\u21CA]\t dispatch to channel failed cause of not exist: %s", sig.Cid)
		}
	}

	// set observe data tags from yomo network by yomo stream function
	// 0x20 comes from other prscd nodes
	// 0x21 comes from backend sfn
	rcvr.SetObserveDataTags(0x20, 0x21)

	// handle data from yomo network, and dispatch to the same channel on this node.
	rcvr.SetHandler(sfnHandler)

	err = rcvr.Connect()
	if err != nil {
		return err
	}

	n.sndr = sndr
	n.rcvr = rcvr
	return nil
}

// BroadcastToYoMo broadcast presence to yomo
func (n *node) BroadcastToYoMo(sig *psig.Signalling) {
	// sig.Sid is sender's sid when sending message
	log.Debug("\033[34m[%s][\u21C8\u21C8]\t %s\033[36m", sig.AppID, sig)
	buf, err := msgpack.Marshal(sig)
	if err != nil {
		log.Error("msgpack marshal: %+v", err)
		return
	}

	err = n.sndr.Write(0x20, buf)
	if err != nil {
		log.Error("broadcast to yomo error: %+v", err)
	}
}

// // Node describes current node, which is a singleton. There is only one node in a `prscd` process.
// // But multiple `prscd` processes can be served on the same server.
// var Node *node

// // CreateNodeSingleton create the singleton node instance.
// func CreateNodeSingleton() {
// 	log.Info("init Node instance, mesh_id=%s", os.Getenv("MESH_ID"))
// 	Node = &node{
// 		MeshID: os.Getenv("MESH_ID"),
// 	}
// }

// DumpNodeState prints the user and room information to stdout.
func DumpNodeState() {
	log.Info("Dump start --------")
	allRealms.Range(func(appID, realm interface{}) bool {
		log.Info("Realm:%s", appID)
		realm.(*node).cdic.Range(func(k1, v1 interface{}) bool {
			log.Info("\tChannel:%s", k1)
			ch := v1.(*Channel)
			log.Info("\t\tPeers count: %d", ch.getLen())
			ch.pdic.Range(func(key, value interface{}) bool {
				log.Info("\t\tPeer: sid=%s, cid=%s", key, value)
				return true
			})
			return true
		})
		return true
	})
	log.Info("Dump done --------")
}

// DumpConnectionsState prints the user and room information to stdout.
func DumpConnectionsState() {
	log.Info("Dump start --------")
	counter := make(map[string]int)

	allRealms.Range(func(appID, realm interface{}) bool {
		log.Info("Realm:%s", appID)
		realm.(*node).cdic.Range(func(k1, v1 interface{}) bool {
			log.Info("\tChannel:%s", k1)
			chName := k1.(string)
			ch := v1.(*Channel)
			peersCount := ch.getLen()
			// chName is like "appID|channelName", so we need to split it to get appID
			appID := strings.Split(chName, "|")[0]
			log.Info("\t\t[%s] %s Peers count: %d", appID, chName, peersCount)
			if _, ok := counter[appID]; !ok {
				counter[appID] = peersCount
			} else {
				counter[appID] += peersCount
			}
			return true
		})
		return true
	})

	// list all counter
	for appID, count := range counter {
		log.Info("->[%s] connections: %d", appID, count)
	}
	// write counter to /tmp/conns.log
	f, err := os.OpenFile("/tmp/conns.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Error("open file: %v", err)
	}
	defer f.Close()
	timestamp := time.Now().Unix()
	for appID, count := range counter {
		if count > 0 {
			f.WriteString(fmt.Sprintf("{\"timestamp\": %d, \"conns\": %d, \"app_id\": \"%s\", \"mesh_id\": \"%s\"}\n\r", timestamp, count, appID, os.Getenv("MESH_ID")))
		}
	}
}
