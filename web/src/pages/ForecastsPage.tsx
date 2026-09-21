import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataStatusIndicator } from '../components/common/DataStatusIndicator';
import { AnalyticsFilterBar } from '../components/analytics/AnalyticsFilterBar';
import { AnalyticsStatCards } from '../components/analytics/AnalyticsStatCards';
import { IntensityTimelineChart } from '../components/analytics/IntensityTimelineChart';
import { SeverityDistributionChart } from '../components/analytics/SeverityDistributionChart';
import { RegionalImpactChart } from '../components/analytics/RegionalImpactChart';
import { AnalyticsService, AnalyticsFilterState } from '../services/analyticsService';
import { useLocation } from '../context/LocationContext';

export const ForecastsPage: React.FC = () => {
  const { selectedCityKey, isGpsActive } = useLocation();

  const [filterState, setFilterState] = useState<AnalyticsFilterState>({
    location: isGpsActive ? 'hyderabad' : selectedCityKey || 'all',
    hazard: 'all',
    dateRange: '7d',
  });

  const handleFilterChange = (newFilter: Partial<AnalyticsFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...newFilter }));
  };

  // Compute reactive analytics result based on active filters
  const analyticsResult = useMemo(() => {
    return AnalyticsService.getAnalyticsData(filterState);
  }, [filterState]);

  const exportPayload = useMemo(() => {
    return AnalyticsService.createExportPayload(filterState, analyticsResult);
  }, [filterState, analyticsResult]);

  return (
    <div className="max-w-[1720px] mx-auto space-y-6 font-sans select-none pb-8">
      {/* 1. Page Header */}
      <PageHeader
        title="Hazard Analytics"
        subtitle="Intensity, severity and regional impact insights for selected hazards."
        badge="TELEMETRY ARCHIVE"
        badgeVariant="cyan"
        actions={<DataStatusIndicator sourceHint="NDMA Incident Registry" />}
      />

      {/* 2. Top Filter Card & Download Analytics Dropdown */}
      <AnalyticsFilterBar
        filter={filterState}
        onFilterChange={handleFilterChange}
        exportPayload={exportPayload}
      />

      {/* 3. 4 Statistic Cards */}
      <AnalyticsStatCards stats={analyticsResult.stats} />

      {/* 4. Main Interactive Timeline Chart */}
      <IntensityTimelineChart data={analyticsResult.timeline} />

      {/* 5. Severity Distribution & Regional Impact Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SeverityDistributionChart data={analyticsResult.severityDistribution} />
        <RegionalImpactChart data={analyticsResult.regionalImpact} />
      </div>
    </div>
  );
};
