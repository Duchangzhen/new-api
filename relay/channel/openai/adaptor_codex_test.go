package openai

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/constant"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestSetupRequestHeaderUsesCodexShapeForGPT55Responses(t *testing.T) {
	oldMode := gin.Mode()
	gin.SetMode(gin.TestMode)
	t.Cleanup(func() { gin.SetMode(oldMode) })

	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/responses", nil)
	c.Request.Header.Set("Content-Type", "application/json; charset=utf-8")

	info := &relaycommon.RelayInfo{
		ChannelType:     constant.ChannelTypeOpenAI,
		RelayMode:       relayconstant.RelayModeResponses,
		OriginModelName: "gpt-5.5",
		ApiKey:          "sk-test",
		IsStream:        true,
	}

	header := http.Header{}
	err := (&Adaptor{}).SetupRequestHeader(c, &header, info)
	require.NoError(t, err)
	require.Equal(t, "application/json", header.Get("Content-Type"))
	require.Equal(t, "responses=experimental", header.Get("OpenAI-Beta"))
	require.Equal(t, "codex_cli_rs", header.Get("originator"))
	require.Equal(t, "codex_cli_rs", header.Get("User-Agent"))
	require.Equal(t, "new-api:gpt-5.5", header.Get("session_id"))
	require.Equal(t, "text/event-stream", header.Get("Accept"))
	require.Equal(t, "Bearer sk-test", header.Get("Authorization"))
}
