package openaicompat

import (
	"strings"

	"github.com/QuantumNous/new-api/setting/model_setting"
)

func IsGPT55Model(model string) bool {
	normalized := strings.ToLower(strings.TrimSpace(model))
	return normalized == "gpt-5.5" ||
		strings.HasPrefix(normalized, "gpt-5.5-") ||
		strings.HasPrefix(normalized, "gpt-5.5.") ||
		strings.HasPrefix(normalized, "gpt-5.5/") ||
		strings.HasPrefix(normalized, "gpt-5.5:")
}

func ShouldForceChatCompletionsUseResponses(model string) bool {
	return IsGPT55Model(model)
}

func ShouldChatCompletionsUseResponsesPolicy(policy model_setting.ChatCompletionsToResponsesPolicy, channelID int, channelType int, model string) bool {
	if !policy.IsChannelEnabled(channelID, channelType) {
		return false
	}
	return matchAnyRegex(policy.ModelPatterns, model)
}

func ShouldChatCompletionsUseResponsesGlobal(channelID int, channelType int, model string) bool {
	return ShouldChatCompletionsUseResponsesPolicy(
		model_setting.GetGlobalSettings().ChatCompletionsToResponsesPolicy,
		channelID,
		channelType,
		model,
	)
}
