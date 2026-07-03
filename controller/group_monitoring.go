package controller

import (
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

const (
	groupMonitoringWindow      = 12 * time.Hour
	groupMonitoringBucket      = 10 * time.Minute
	groupMonitoringCacheTTL    = 2 * time.Minute
	groupMonitoringAnomalyRate = 95.0
)

type groupMonitoringHistoryPoint struct {
	Timestamp    int64    `json:"timestamp"`
	SuccessRate  *float64 `json:"success_rate"`
	CacheHitRate *float64 `json:"cache_hit_rate"`
	Requests     int64    `json:"requests"`
	SuccessCount int64    `json:"-"`
	CacheHits    int64    `json:"-"`
}

type groupMonitoringGroup struct {
	Tag                    string                        `json:"tag"`
	Name                   string                        `json:"name"`
	ModelName              string                        `json:"model_name"`
	State                  string                        `json:"state"`
	TotalChannels          int                           `json:"total_channels"`
	EnabledChannels        int                           `json:"enabled_channels"`
	ManualDisabledChannels int                           `json:"manual_disabled_channels"`
	AutoDisabledChannels   int                           `json:"auto_disabled_channels"`
	RecentRequests         int64                         `json:"recent_requests"`
	AverageLatencyMs       int                           `json:"average_latency_ms"`
	AvailabilityRate       float64                       `json:"availability_rate"`
	CacheHitRate           float64                       `json:"cache_hit_rate"`
	LastProbeAt            int64                         `json:"last_probe_at"`
	LastRequestAt          int64                         `json:"last_request_at"`
	History                []groupMonitoringHistoryPoint `json:"history"`
}

type groupMonitoringSummary struct {
	AvailableGroups   int   `json:"available_groups"`
	AnomalyGroups     int   `json:"anomaly_groups"`
	IdleGroups        int   `json:"idle_groups"`
	UnavailableGroups int   `json:"unavailable_groups"`
	TotalGroups       int   `json:"total_groups"`
	UpdatedAt         int64 `json:"updated_at"`
}

type groupMonitoringResponse struct {
	Summary groupMonitoringSummary `json:"summary"`
	Groups  []groupMonitoringGroup `json:"groups"`
}

type groupMonitoringAccumulator struct {
	Tag                    string
	Name                   string
	ModelName              string
	TotalChannels          int
	EnabledChannels        int
	ManualDisabledChannels int
	AutoDisabledChannels   int
	ResponseLatencyTotal   int64
	ResponseLatencyCount   int64
	LastProbeAt            int64
	RecentRequests         int64
	RecentSuccesses        int64
	RecentCacheHits        int64
	LastRequestAt          int64
	History                []groupMonitoringHistoryPoint
}

type groupMonitoringLogRow struct {
	CreatedAt int64
	Type      int
	ChannelId int
	Other     string
}

type groupMonitoringCacheEntry struct {
	ExpiresAt time.Time
	Payload   groupMonitoringResponse
}

var (
	groupMonitoringCache   groupMonitoringCacheEntry
	groupMonitoringCacheMu sync.RWMutex
)

func GetGroupMonitoring(c *gin.Context) {
	payload, err := getGroupMonitoringPayload()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    payload,
	})
}

func getGroupMonitoringPayload() (groupMonitoringResponse, error) {
	now := time.Now()

	groupMonitoringCacheMu.RLock()
	if now.Before(groupMonitoringCache.ExpiresAt) {
		cached := groupMonitoringCache.Payload
		groupMonitoringCacheMu.RUnlock()
		return cached, nil
	}
	groupMonitoringCacheMu.RUnlock()

	groupMonitoringCacheMu.Lock()
	defer groupMonitoringCacheMu.Unlock()
	if now.Before(groupMonitoringCache.ExpiresAt) {
		return groupMonitoringCache.Payload, nil
	}

	payload, err := buildGroupMonitoringPayload(now)
	if err != nil {
		return groupMonitoringResponse{}, err
	}
	groupMonitoringCache = groupMonitoringCacheEntry{
		ExpiresAt: now.Add(groupMonitoringCacheTTL),
		Payload:   payload,
	}
	return payload, nil
}

func buildGroupMonitoringPayload(now time.Time) (groupMonitoringResponse, error) {
	var channels []*model.Channel
	if err := model.DB.
		Where("tag IS NOT NULL AND tag != ''").
		Omit("key").
		Find(&channels).Error; err != nil {
		return groupMonitoringResponse{}, err
	}

	startTime := now.Add(-groupMonitoringWindow).Unix()
	bucketCount := int(groupMonitoringWindow / groupMonitoringBucket)
	if bucketCount <= 0 {
		bucketCount = 1
	}

	accumulators := make(map[string]*groupMonitoringAccumulator)
	channelToTag := make(map[int]string)
	channelIDs := make([]int, 0, len(channels))

	for _, ch := range channels {
		tag := strings.TrimSpace(ch.GetTag())
		if tag == "" {
			continue
		}

		acc, ok := accumulators[tag]
		if !ok {
			acc = &groupMonitoringAccumulator{
				Tag:     tag,
				Name:    tag,
				History: make([]groupMonitoringHistoryPoint, bucketCount),
			}
			for i := range acc.History {
				acc.History[i].Timestamp = startTime + int64(i)*int64(groupMonitoringBucket/time.Second)
			}
			accumulators[tag] = acc
		}

		acc.TotalChannels++
		switch ch.Status {
		case common.ChannelStatusEnabled:
			acc.EnabledChannels++
		case common.ChannelStatusManuallyDisabled:
			acc.ManualDisabledChannels++
		default:
			acc.AutoDisabledChannels++
		}
		if ch.ResponseTime > 0 {
			acc.ResponseLatencyTotal += int64(ch.ResponseTime)
			acc.ResponseLatencyCount++
		}
		if ch.TestTime > acc.LastProbeAt {
			acc.LastProbeAt = ch.TestTime
		}
		if acc.ModelName == "" {
			acc.ModelName = pickChannelDisplayModel(ch)
		}

		channelToTag[ch.Id] = tag
		channelIDs = append(channelIDs, ch.Id)
	}

	if len(channelIDs) > 0 {
		var rows []groupMonitoringLogRow
		if err := model.LOG_DB.
			Table("logs").
			Select("created_at, type, channel_id, other").
			Where("created_at >= ? AND channel_id IN ? AND type IN ?", startTime, channelIDs, []int{model.LogTypeConsume, model.LogTypeError}).
			Find(&rows).Error; err != nil {
			return groupMonitoringResponse{}, err
		}

		for _, row := range rows {
			tag, ok := channelToTag[row.ChannelId]
			if !ok {
				continue
			}
			acc := accumulators[tag]
			if acc == nil {
				continue
			}

			if row.CreatedAt > acc.LastRequestAt {
				acc.LastRequestAt = row.CreatedAt
			}

			bucketIndex := int((row.CreatedAt - startTime) / int64(groupMonitoringBucket/time.Second))
			if bucketIndex < 0 || bucketIndex >= len(acc.History) {
				continue
			}

			point := &acc.History[bucketIndex]
			point.Requests++
			acc.RecentRequests++

			if row.Type == model.LogTypeConsume {
				acc.RecentSuccesses++
				point.SuccessCount++
				if hasCacheHitSignal(row.Other) {
					acc.RecentCacheHits++
					point.CacheHits++
				}
			}
		}
	}

	groups := make([]groupMonitoringGroup, 0, len(accumulators))
	summary := groupMonitoringSummary{}

	for _, acc := range accumulators {
		finalizeGroupHistory(acc)
		group := materializeGroup(acc)
		switch group.State {
		case "available":
			summary.AvailableGroups++
		case "anomaly":
			summary.AnomalyGroups++
		case "idle":
			summary.IdleGroups++
		default:
			summary.UnavailableGroups++
		}
		if group.LastRequestAt > summary.UpdatedAt {
			summary.UpdatedAt = group.LastRequestAt
		}
		if group.LastProbeAt > summary.UpdatedAt {
			summary.UpdatedAt = group.LastProbeAt
		}
		groups = append(groups, group)
	}

	sort.Slice(groups, func(i, j int) bool {
		li := groupMonitoringStateOrder(groups[i].State)
		lj := groupMonitoringStateOrder(groups[j].State)
		if li != lj {
			return li < lj
		}
		if groups[i].RecentRequests != groups[j].RecentRequests {
			return groups[i].RecentRequests > groups[j].RecentRequests
		}
		if groups[i].AvailabilityRate != groups[j].AvailabilityRate {
			return groups[i].AvailabilityRate > groups[j].AvailabilityRate
		}
		return strings.ToLower(groups[i].Name) < strings.ToLower(groups[j].Name)
	})

	summary.TotalGroups = len(groups)
	if summary.UpdatedAt == 0 {
		summary.UpdatedAt = now.Unix()
	}

	return groupMonitoringResponse{
		Summary: summary,
		Groups:  groups,
	}, nil
}

func pickChannelDisplayModel(channel *model.Channel) string {
	if channel.TestModel != nil && strings.TrimSpace(*channel.TestModel) != "" {
		return strings.TrimSpace(*channel.TestModel)
	}
	for _, item := range strings.Split(channel.Models, ",") {
		if modelName := strings.TrimSpace(item); modelName != "" {
			return modelName
		}
	}
	if name := strings.TrimSpace(channel.Name); name != "" {
		return name
	}
	return channel.GetTag()
}

func hasCacheHitSignal(raw string) bool {
	if strings.TrimSpace(raw) == "" {
		return false
	}
	data, err := common.StrToMap(raw)
	if err != nil || data == nil {
		return false
	}
	if numericMapValue(data, "cache_tokens") > 0 {
		return true
	}
	if numericMapValue(data, "prompt_cache_hit_tokens") > 0 {
		return true
	}
	return false
}

func numericMapValue(data map[string]interface{}, key string) float64 {
	value, ok := data[key]
	if !ok {
		return 0
	}
	switch typed := value.(type) {
	case float64:
		return typed
	case float32:
		return float64(typed)
	case int:
		return float64(typed)
	case int64:
		return float64(typed)
	case int32:
		return float64(typed)
	}
	return 0
}

func finalizeGroupHistory(acc *groupMonitoringAccumulator) {
	for i := range acc.History {
		point := &acc.History[i]
		if point.Requests == 0 {
			continue
		}

		successRate := float64(point.SuccessCount) / float64(point.Requests) * 100
		point.SuccessRate = &successRate

		if point.SuccessCount > 0 {
			cacheHitRate := float64(point.CacheHits) / float64(point.SuccessCount) * 100
			point.CacheHitRate = &cacheHitRate
		}
	}
}

func materializeGroup(acc *groupMonitoringAccumulator) groupMonitoringGroup {
	availability := 0.0
	if acc.RecentRequests > 0 {
		availability = float64(acc.RecentSuccesses) / float64(acc.RecentRequests) * 100
	} else if acc.TotalChannels > 0 {
		availability = float64(acc.EnabledChannels) / float64(acc.TotalChannels) * 100
	}

	cacheHitRate := 0.0
	if acc.RecentSuccesses > 0 {
		cacheHitRate = float64(acc.RecentCacheHits) / float64(acc.RecentSuccesses) * 100
	}

	avgLatency := 0
	if acc.ResponseLatencyCount > 0 {
		avgLatency = int(acc.ResponseLatencyTotal / acc.ResponseLatencyCount)
	}

	state := "unavailable"
	switch {
	case acc.EnabledChannels == 0:
		state = "unavailable"
	case acc.RecentRequests == 0:
		state = "idle"
	case availability < groupMonitoringAnomalyRate:
		state = "anomaly"
	default:
		state = "available"
	}

	return groupMonitoringGroup{
		Tag:                    acc.Tag,
		Name:                   acc.Name,
		ModelName:              acc.ModelName,
		State:                  state,
		TotalChannels:          acc.TotalChannels,
		EnabledChannels:        acc.EnabledChannels,
		ManualDisabledChannels: acc.ManualDisabledChannels,
		AutoDisabledChannels:   acc.AutoDisabledChannels,
		RecentRequests:         acc.RecentRequests,
		AverageLatencyMs:       avgLatency,
		AvailabilityRate:       availability,
		CacheHitRate:           cacheHitRate,
		LastProbeAt:            acc.LastProbeAt,
		LastRequestAt:          acc.LastRequestAt,
		History:                acc.History,
	}
}

func groupMonitoringStateOrder(state string) int {
	switch state {
	case "available":
		return 0
	case "anomaly":
		return 1
	case "idle":
		return 2
	default:
		return 3
	}
}
