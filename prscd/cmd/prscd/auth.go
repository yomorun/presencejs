package main

import (
	"os"

	"yomo.run/prscd/chirp"
)

func init() {
	chirp.AuthUserAndGetYoMoCredential = func(publicKey string) (appID, credential string, ok bool) {
		log.Info("Node| auth_user: publicKey=%s", publicKey)
		return "YOMO_APP", os.Getenv("YOMO_CREDENTIAL"), true
	}
}
