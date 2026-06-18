package openaicompat

import (
	"testing"

	"github.com/QuantumNous/new-api/dto"
	"github.com/stretchr/testify/require"
)

func TestChatCompletionsRequestToResponsesRequestAddsCodexPromptCacheKey(t *testing.T) {
	req := &dto.GeneralOpenAIRequest{
		Model: "gpt-5.5",
		Messages: []dto.Message{
			{Role: "user", Content: "hi"},
		},
	}

	out, err := ChatCompletionsRequestToResponsesRequest(req)
	require.NoError(t, err)
	require.Equal(t, `"new-api:gpt-5.5"`, string(out.PromptCacheKey))
	require.Equal(t, `false`, string(out.Store))
	require.Nil(t, out.Temperature)
	require.Nil(t, out.MaxOutputTokens)
}
