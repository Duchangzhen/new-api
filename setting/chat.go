package setting

import (
	"encoding/json"

	"github.com/QuantumNous/new-api/common"
)

var Chats = []map[string]string{
	{
		"CC Switch": "ccswitch",
	},
	{
		"Codex安装助手": "codex-assistant://import-provider?provider=ACAIM&homepage={address}&endpoint={address}%2Fv1&apiKey={key}&model=gpt-5.5&protocol=responses&apply=1",
	},
}

func UpdateChatsByJsonString(jsonString string) error {
	Chats = make([]map[string]string, 0)
	return json.Unmarshal([]byte(jsonString), &Chats)
}

func Chats2JsonString() string {
	jsonBytes, err := json.Marshal(Chats)
	if err != nil {
		common.SysLog("error marshalling chats: " + err.Error())
		return "[]"
	}
	return string(jsonBytes)
}
