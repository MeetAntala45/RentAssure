import React, { useState, useMemo } from 'react';

// Curated harmonious palette matching the reference UI
const CHART_PALETTE = ['#18181b', '#3f3f46', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8', '#27272a'];

/**
 * 1. Dynamic Donut Chart for RentAssure Categories
 * Accepts backend CategoryShareDto array:
 * [{ categoryName: 'Living & Bedroom Furniture', itemCount: 12, activeBookingsCount: 5, totalVolume: 2400 }, ...]
 */
export const DonutCategoryChart = ({
  data = [],
  title = 'Rental Inventory by Category',
  subText = 'Items Listed',
}) => {
  const [metric, setMetric] = useState('items'); // 'items' | 'volume'

  const hasRealData = data && data.length > 0 && data.some((d) => (d.itemCount || d.activeBookingsCount || d.value || 0) > 0);

  const normalizedData = hasRealData
    ? data.slice(0, 6).map((item, idx) => {
        const label = item.categoryName || item.label || `Category ${idx + 1}`;
        let val = 0;
        if (metric === 'volume') {
          val = item.totalVolume !== undefined ? Math.round(item.totalVolume) : (item.value || 0);
        } else {
          val = item.itemCount !== undefined ? item.itemCount : (item.activeBookingsCount !== undefined ? item.activeBookingsCount : (item.value || 0));
        }
        const color = item.color || CHART_PALETTE[idx % CHART_PALETTE.length];
        return { label, value: Math.max(0, val), color };
      })
    : [];

  const total = normalizedData.reduce((acc, curr) => acc + curr.value, 0);

  // SVG Donut calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <div className="ra-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="ra-card-header">
        <h3 className="ra-card-title">{title}</h3>
        {hasRealData && (
          <div className="ra-time-pills">
            <button
              type="button"
              className={`ra-time-pill ${metric === 'items' ? 'active' : ''}`}
              onClick={() => setMetric('items')}
            >
              By Items
            </button>
            <button
              type="button"
              className={`ra-time-pill ${metric === 'volume' ? 'active' : ''}`}
              onClick={() => setMetric('volume')}
            >
              By Volume ($)
            </button>
          </div>
        )}
      </div>

      {!hasRealData ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', color: '#71717a', fontSize: '13px' }}>
          No category distribution data recorded yet.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(140px, 160px) 1fr',
            gap: '24px',
            alignItems: 'center',
            flex: 1,
            marginTop: '8px',
          }}
        >
          {/* Donut SVG with center text */}
          <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto' }}>
            <svg viewBox="0 0 160 160" width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
              {normalizedData.map((item, idx) => {
                if (item.value === 0 || total === 0) return null;
                const ratio = item.value / total;
                const strokeDasharray = `${ratio * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativePercent * circumference;
                cumulativePercent += ratio;

                return (
                  <circle
                    key={idx}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="18"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'all 0.5s ease' }}
                  >
                    <title>{`${item.label}: ${metric === 'volume' ? '$' + item.value.toLocaleString() : item.value} (${((item.value / total) * 100).toFixed(1)}%)`}</title>
                  </circle>
                );
              })}
            </svg>

            {/* Center text */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#18181b', lineHeight: 1.1 }}>
                {metric === 'volume' ? `$${total.toLocaleString()}` : total.toLocaleString()}
              </span>
              <span style={{ fontSize: '11px', color: '#71717a', fontWeight: 600, marginTop: '2px' }}>
                {metric === 'volume' ? 'Total Volume' : subText}
              </span>
            </div>
          </div>

          {/* Legend list matching reference UI */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
            {normalizedData.map((item, idx) => {
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '2.5px',
                        backgroundColor: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        color: '#27272a',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={item.label}
                    >
                      {item.label}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontWeight: 800, color: '#18181b' }}>
                      {metric === 'volume' ? `$${item.value.toLocaleString()}` : item.value}
                    </span>
                    <span style={{ fontWeight: 500, color: '#71717a', fontSize: '11px', marginLeft: '4px' }}>
                      ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 2. Dynamic Revenue Overview Bar Chart for RentAssure
 * Accepts backend MonthlyTrends array:
 * [{ month: 'May 2026', grossRent: 1200, commission: 144, netProfit: 1056, bookingCount: 4 }, ...]
 */
export const RevenueOverviewBarChart = ({
  trends = [],
  title = 'Monthly Profit & Revenue Overview',
  defaultMetric = 'profit',
  showProfitOption = true,
}) => {
  const [metric, setMetric] = useState(defaultMetric); // 'profit' | 'gross' | 'bookings'
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Generate real calendar months (last 6 months) with 0 values if backend trends are empty
  const rawData = useMemo(() => {
    if (Array.isArray(trends) && trends.length > 0) {
      return trends.slice(-6);
    }
    const emptyMonths = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthShort = d.toLocaleString('en-US', { month: 'short' });
      const fullMonth = `${monthShort} ${d.getFullYear()}`;
      emptyMonths.push({
        month: fullMonth,
        grossRent: 0,
        netProfit: 0,
        bookingCount: 0,
        commission: 0,
      });
    }
    return emptyMonths;
  }, [trends]);

  // Format real data strictly from backend values
  const formattedData = useMemo(() => {
    return rawData.map((t) => {
      const fullMonth = t.month || t.Month || '';
      const label = fullMonth ? fullMonth.split(' ')[0] : 'Mo';
      const gross = Number(t.grossRent ?? t.GrossRent ?? 0);
      const netProfit = Number(
        t.netProfit !== undefined
          ? t.netProfit
          : t.NetProfit !== undefined
          ? t.NetProfit
          : gross > 0
          ? Math.round(gross * 0.88 * 100) / 100
          : 0
      );
      const count = Number(t.bookingCount ?? t.BookingCount ?? 0);

      let value = gross;
      if (metric === 'profit') value = netProfit;
      else if (metric === 'bookings') value = count;

      return {
        label,
        fullMonth: fullMonth || label,
        gross,
        profit: netProfit,
        count,
        value,
      };
    });
  }, [rawData, metric]);

  // Max actual value across items
  const maxActual = Math.max(...formattedData.map((d) => d.value), 0);

  // Calculate clean, mathematically rounded max ceiling so ticks divide cleanly by 4
  const ceiling = useMemo(() => {
    if (metric === 'bookings') {
      if (maxActual <= 0) return 4;
      if (maxActual <= 4) return 4;
      if (maxActual <= 8) return 8;
      if (maxActual <= 16) return 16;
      return Math.ceil(maxActual / 4) * 4;
    }
    if (maxActual <= 0) return 1000;
    const exp = Math.floor(Math.log10(maxActual));
    const base = Math.pow(10, exp);
    const frac = maxActual / base;
    let factor = 10;
    if (frac <= 1.2) factor = 1.2;
    else if (frac <= 2) factor = 2;
    else if (frac <= 4) factor = 4;
    else if (frac <= 6) factor = 6;
    else if (frac <= 8) factor = 8;
    return Math.max(100, Math.round(factor * base));
  }, [maxActual, metric]);

  const formatTick = (val) => {
    if (metric === 'bookings') return `${Math.round(val)}`;
    if (val === 0) return '$0';
    if (val >= 1000000) {
      const m = val / 1000000;
      return `$${m % 1 === 0 ? m : m.toFixed(1)}M`;
    }
    if (val >= 1000) {
      const k = val / 1000;
      return `$${k % 1 === 0 ? k : k.toFixed(1)}k`;
    }
    return `$${Math.round(val)}`;
  };

  const ticks = [
    { label: formatTick(ceiling), ratio: 1.0 },
    { label: formatTick(ceiling * 0.75), ratio: 0.75 },
    { label: formatTick(ceiling * 0.5), ratio: 0.5 },
    { label: formatTick(ceiling * 0.25), ratio: 0.25 },
    { label: '$0', ratio: 0.0 },
  ];

  // SVG Coordinate Geometry (viewBox: 0 0 600 230)
  const plotLeft = 60;
  const plotRight = 580;
  const plotWidth = plotRight - plotLeft; // 520px
  const plotTop = 26;
  const plotBottom = 186;
  const plotHeight = plotBottom - plotTop; // 160px
  const numBars = formattedData.length;
  const colWidth = numBars > 0 ? plotWidth / numBars : plotWidth;
  const barWidth = 22;

  const barColor = metric === 'profit' ? '#18181b' : metric === 'gross' ? '#3f3f46' : '#71717a';
  const barHoverColor = metric === 'profit' ? '#27272a' : metric === 'gross' ? '#52525b' : '#a1a1aa';

  return (
    <div className="ra-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="ra-card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 className="ra-card-title">{title}</h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
            Real-time monthly store performance from customer reservations
          </p>
        </div>
        <div className="ra-time-pills">
          {showProfitOption && (
            <button
              type="button"
              className={`ra-time-pill ${metric === 'profit' ? 'active' : ''}`}
              onClick={() => setMetric('profit')}
            >
              Net Profit ($)
            </button>
          )}
          <button
            type="button"
            className={`ra-time-pill ${metric === 'gross' ? 'active' : ''}`}
            onClick={() => setMetric('gross')}
          >
            Gross Rent ($)
          </button>
          <button
            type="button"
            className={`ra-time-pill ${metric === 'bookings' ? 'active' : ''}`}
            onClick={() => setMetric('bookings')}
          >
            Bookings
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: '230px', marginTop: '8px', position: 'relative' }}>
        <svg
          viewBox="0 0 600 230"
          style={{ width: '100%', height: '100%', minHeight: '230px', display: 'block', overflow: 'visible' }}
        >
          {/* Horizontal Gridlines & Y-Axis Ticks */}
          {ticks.map((tick, i) => {
            const y = plotTop + (1.0 - tick.ratio) * plotHeight;
            const isBaseline = tick.ratio === 0;

            return (
              <g key={i}>
                {/* Horizontal line */}
                <line
                  x1={plotLeft}
                  y1={y}
                  x2={plotRight}
                  y2={y}
                  stroke={isBaseline ? '#e2e8f0' : '#f1f5f9'}
                  strokeDasharray={isBaseline ? undefined : '4 4'}
                  strokeWidth={isBaseline ? 1.5 : 1}
                />
                {/* Y-axis tick label */}
                <text
                  x={plotLeft - 10}
                  y={y}
                  dominantBaseline="central"
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Bar Columns and X-Axis Month Labels */}
          {formattedData.map((bar, idx) => {
            const centerX = plotLeft + (idx + 0.5) * colWidth;
            const barX = centerX - barWidth / 2;
            const isHovered = hoveredIdx === idx;
            const val = bar.value;
            const barHeight = ceiling > 0 && val > 0 ? Math.max(4, (val / ceiling) * plotHeight) : 0;
            const barY = plotBottom - barHeight;

            const tooltipText = `${bar.fullMonth}: $${bar.profit.toLocaleString()} Net Profit | $${bar.gross.toLocaleString()} Gross Rent (${bar.count} Bookings)`;
            const tipValue =
              metric === 'bookings'
                ? `${bar.count} Bookings`
                : metric === 'profit'
                ? `$${bar.profit.toLocaleString()}`
                : `$${bar.gross.toLocaleString()}`;

            return (
              <g key={idx}>
                {/* Column hover background highlight */}
                {isHovered && (
                  <rect
                    x={plotLeft + idx * colWidth + 4}
                    y={plotTop}
                    width={colWidth - 8}
                    height={plotHeight}
                    rx="6"
                    fill="#f8fafc"
                    opacity="0.9"
                    pointerEvents="none"
                  />
                )}

                {/* Vertical Bar (Real Data) */}
                {barHeight > 0 ? (
                  <rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    rx="4"
                    ry="4"
                    fill={isHovered ? barHoverColor : barColor}
                    style={{ transition: 'all 0.25s ease' }}
                  >
                    <title>{tooltipText}</title>
                  </rect>
                ) : (
                  /* 0 value baseline pill - cleanly sits on baseline without fake data */
                  <rect
                    x={barX}
                    y={plotBottom - 2}
                    width={barWidth}
                    height="2"
                    rx="1"
                    fill={isHovered ? '#94a3b8' : '#cbd5e1'}
                    opacity="0.7"
                  >
                    <title>{tooltipText}</title>
                  </rect>
                )}

                {/* X-Axis Month Label (Cleanly separated 24px below baseline) */}
                <text
                  x={centerX}
                  y={plotBottom + 24}
                  textAnchor="middle"
                  fill={isHovered ? '#1e293b' : '#64748b'}
                  fontSize="12"
                  fontWeight={isHovered ? 700 : 600}
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {bar.label}
                </text>

                {/* Floating Tooltip Pill on Hover */}
                {isHovered && (
                  <g pointerEvents="none">
                    <rect
                      x={centerX - 46}
                      y={Math.max(6, barHeight > 0 ? barY - 28 : plotBottom - 30)}
                      width="92"
                      height="22"
                      rx="5"
                      fill="#1e293b"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                    />
                    <text
                      x={centerX}
                      y={Math.max(6, barHeight > 0 ? barY - 28 : plotBottom - 30) + 14}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {tipValue}
                    </text>
                  </g>
                )}

                {/* Transparent Hit Area for Interactivity */}
                <rect
                  x={plotLeft + idx * colWidth}
                  y={plotTop}
                  width={colWidth}
                  height={plotHeight + 35}
                  fill="transparent"
                  cursor="pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

/**
 * 3. Dynamic Top Cities Spline Chart for RentAssure
 * Accepts backend TopCities array:
 * [{ city: 'San Francisco', bookingCount: 8, totalVolume: 4200 }, ...]
 */
export const TopCitiesSplineChart = ({
  cities = [],
  title = 'Rental Destinations by Metro Area',
}) => {
  const hasRealCities = cities && cities.length > 0 && cities.some((c) => (c.bookingCount || c.totalVolume || 0) > 0);
  const displayCities = hasRealCities ? cities.slice(0, 5) : [];

  const totalBookings = displayCities.reduce((acc, c) => acc + (c.bookingCount || 0), 0);
  const maxVal = Math.max(...displayCities.map((c) => c.bookingCount || 1), 10);

  // Compute smooth spline points
  const points = displayCities.map((c, idx) => {
    const x = 30 + (idx * (340 / Math.max(1, displayCities.length - 1)));
    const normalized = (c.bookingCount || 0) / maxVal;
    const y = 150 - (normalized * 110); // clamped between 40 and 150
    return { x, y, city: c.city, count: c.bookingCount || 0, volume: c.totalVolume || 0 };
  });

  // Second curve (e.g. active subscriptions / volume ratio)
  const volumePoints = displayCities.map((c, idx) => {
    const x = 30 + (idx * (340 / Math.max(1, displayCities.length - 1)));
    const maxVol = Math.max(...displayCities.map((d) => d.totalVolume || 1), 1000);
    const normalized = (c.totalVolume || 0) / maxVol;
    const y = 145 - (normalized * 95);
    return { x, y };
  });

  const buildPath = (pts) => {
    if (!pts || pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y} L 400,${pts[0].y}`;
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) / 2;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) / 2;
      const cy2 = p1.y;
      d += ` C ${cx1},${cy1} ${cx2},${cy2} ${p1.x},${p1.y}`;
    }
    return d;
  };

  const bookingPath = buildPath(points);
  const volumePath = buildPath(volumePoints);

  const yTicks = [`${maxVal}`, `${Math.round(maxVal * 0.75)}`, `${Math.round(maxVal * 0.5)}`, `${Math.round(maxVal * 0.25)}`, '0'];

  return (
    <div className="ra-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="ra-card-header">
        <h3 className="ra-card-title">{title}</h3>
        {hasRealCities && (
          <span className="ra-badge ra-badge-verified">
            {totalBookings} Total Rentals
          </span>
        )}
      </div>

      {!hasRealCities ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', color: '#71717a', fontSize: '13px' }}>
          No metro destination data recorded yet.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', height: '190px', alignItems: 'stretch', gap: '14px', marginTop: '12px' }}>
            {/* Y-axis labels */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                fontSize: '11px',
                color: '#94a3b8',
                fontWeight: 600,
                paddingRight: '6px',
                minWidth: '32px',
                textAlign: 'right',
              }}
            >
              {yTicks.map((tick, i) => (
                <span key={i}>{tick}</span>
              ))}
            </div>

            {/* SVG Canvas */}
            <div style={{ flex: 1, position: 'relative', height: '100%' }}>
              <svg viewBox="0 0 400 180" width="100%" height="100%" preserveAspectRatio="none">
                {/* Horizontal dashed grid lines */}
                <line x1="0" y1="20" x2="400" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="400" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="140" x2="400" y2="140" stroke="#f1f5f9" strokeDasharray="3 3" />

                {/* Volume Path (Slate Grey) */}
                <path d={volumePath} fill="none" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" />

                {/* Bookings Path (Charcoal #18181b) */}
                <path d={bookingPath} fill="none" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" />

                {/* Points */}
                {points.map((pt, i) => (
                  <circle
                    key={`b-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill="#ffffff"
                    stroke="#18181b"
                    strokeWidth="2.5"
                  >
                    <title>{`${pt.city}: ${pt.count} Bookings`}</title>
                  </circle>
                ))}

                {volumePoints.map((pt, i) => (
                  <circle
                    key={`v-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill="#ffffff"
                    stroke="#71717a"
                    strokeWidth="2.5"
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* City Breakdown Legend Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '8px',
              marginTop: 'auto',
              paddingTop: '12px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            {displayCities.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length],
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.city}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {c.bookingCount || 0} Rentals
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * 4. Dynamic Top Store Partners / Top Items Leaderboard for RentAssure
 * Accepts backend TopPartners array:
 * [{ vendorId, storeName, ownerName, category, completedBookings, totalEarnings }]
 */
export const TopPartnersList = ({
  partners = [],
  title = 'Top Merchant Store Partners',
  onViewAll = () => {},
}) => {
  const hasRealPartners = partners && partners.length > 0;

  const displayList = hasRealPartners
    ? partners.slice(0, 4).map((p, idx) => ({
        id: p.vendorId || p.id || idx,
        name: p.storeName || p.name || p.title || 'Merchant Partner',
        role: p.ownerName ? `${p.ownerName} • ${p.category || 'Verified Store'}` : (p.category || p.categoryName || 'Verified Store Partner'),
        count: p.completedBookings || p.totalBookingsCount || p.rentals || 0,
        earnings: p.totalEarnings || p.netProfit || null,
        imageUrl: p.imageUrl || null,
      }))
    : [];

  return (
    <div className="ra-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="ra-card-header">
        <h3 className="ra-card-title">{title}</h3>
        {hasRealPartners && (
          <button
            type="button"
            onClick={onViewAll}
            style={{
              background: 'transparent',
              border: '1px solid #e4e4e7',
              borderRadius: '8px',
              color: '#18181b',
              fontWeight: 700,
              fontSize: '12.5px',
              padding: '5px 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#18181b';
              e.currentTarget.style.background = '#f4f4f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e4e4e7';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            View All →
          </button>
        )}
      </div>

      {!hasRealPartners ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', color: '#71717a', fontSize: '13px' }}>
          No merchant partners recorded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center' }}>
          {displayList.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: idx < displayList.length - 1 ? '1px solid #f8fafc' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                {/* Medal indicator */}
                <div
                  style={{
                    width: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: idx === 0 ? '18px' : idx === 1 ? '18px' : idx === 2 ? '18px' : '14px',
                    fontWeight: 800,
                    color: '#64748b',
                    flexShrink: 0,
                  }}
                >
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                </div>

                {/* Avatar / Store initial icon */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: '#f4f4f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#18181b',
                    flexShrink: 0,
                    border: '1px solid #e4e4e7',
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    item.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Store Name & Category */}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: '#18181b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#71717a', marginTop: '1px' }}>
                    {item.role}
                  </div>
                </div>
              </div>

              {/* Stat on right */}
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#18181b', lineHeight: 1.1 }}>
                  {item.count.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#71717a', fontWeight: 500, marginTop: '2px' }}>
                  {item.earnings ? `$${Math.round(item.earnings).toLocaleString()}` : 'Rentals'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
